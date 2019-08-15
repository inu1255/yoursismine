import axios from 'axios';

export const config = {
    anti_content: '',
}

export class Pdd {
    pdduid: string;
    access_token: string;
    share_uid: string;
    invite_channel: string;
    mode: 0 | 1; // 0: 最大收益 1: 最小收获次数

    coin_amount: number;
    next_harvest_time: number;
    running: boolean;
    onError: Function;
    constructor(pdduid: string, AccessToken: string, onError?: Function) {
        this.pdduid = pdduid;
        this.access_token = AccessToken;
        this.share_uid = "";
        this.invite_channel = "1";

        this.coin_amount = 0;
        this.next_harvest_time = 0;
        this.running = false;
        this.mode = 0;
        this.onError = onError;
    }
    post(url: string, data?: any) {
        url += `?pdduid=${this.pdduid}&__json=1`
        data = JSON.stringify(Object.assign(data || {}, {
            AccessToken: this.access_token,
            anti_content: config.anti_content,
        }))
        if (!/portal/.test(url)) console.log(url)
        return axios.post('https://api.pinduoduo.com' + url, data, {
            validateStatus: () => true,
            timeout: 10e3,
            headers: {
                // "Accept": "*/*",
                "Content-Type": "text/plain;charset=UTF-8",
                // "User-Agent": "Mozilla/5.0 (Linux; Android 9; MI 6 Build/PKQ1.190118.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044807 Mobile Safari/537.36 MMWEBID/3912 MicroMessenger/7.0.5.1440(0x27000537) Process/tools NetType/WIFI Language/zh_CN",
                // "X-Requested-With": "com.tencent.mm",
                // "Origin": "https://mobile.yangkeduo.com",
                // "Referer": "https://mobile.yangkeduo.com/farm_pet_lion7.html?_wv=41729&_wvx=10&invite_channel=1&refer_share_id=dSymd15WK6GJdN0eaMDaRcV6zOOTndNl&refer_share_uid=5789527461&refer_share_channel=message&from=groupmessage",
                // "Cookie": this.cookie
            },
        }).then(ret => {
            if (ret.data.error_msg || ret.data.error_code) {
                ret.data.url = ret.config.url;
                throw ret.data;
            }
            return ret.data
        })
    }

    queryPortal(): Promise<QueryPortalResponse> {
        return this.post('/api/farm-gateway/farm/query/portal', {
            share_uid: this.share_uid,
            invite_channel: this.invite_channel,
        })
    }

    plantUnlock(plant_type: number): Promise<PlantUnlockResponse> {
        return this.post('/api/farm/command/plant/unlock', { plant_type })
    }

    plantCreate(plant_type: number, land_id: number, plant_mode?: number): Promise<CreateResponse> {
        return this.post('/api/farm/command/plant/create', {
            plant_type,
            land_id,
            plant_mode: plant_mode || 0,
            share_uid: this.share_uid,
            invite_channel: this.invite_channel,
        })
    }

    plantHarvest(land_id: number): Promise<PlantHavestResponse> {
        return this.post('/api/farm/command/plant/harvest', { land_id })
    }

    plantSpeedup(land_id: number, type: number): Promise<PlantSpeedupResponse> {
        return this.post('/api/farm/command/plant/speedup', { land_id, type })
    }

    plantList(): Promise<PlantListResponse> {
        return this.post('/api/farm/query/plant/list')
    }

    landUnlock(land_id: number): Promise<LandUnlockResponse> {
        return this.post('/api/farm/command/land/unlock', { land_id })
    }

    missionComplete(mission_type: number): Promise<boolean> {
        return this.post('/api/farm-gateway/mission/command/mission/complete', { mission_type }).then(x => x && x.complete_success)
    }

    rewardGain(mission_type: number): Promise<boolean> {
        return this.post('/api/farm-gateway/mission/command/reward/gain', { mission_type }).then(x => !!(x && x.reward_result))
    }

    waterGain(mission_type: number, gain_time?: number): Promise<WaterGainResponse> {
        return this.post('/api/manor/water/gain', { gain_time: gain_time || 1, mission_type })
    }

    waterCost() {
        return this.post('/api/manor/water/cost', { mission_type: 0 })
    }

    waterRewardGain(stage_level: number, activity_id: number) {
        return this.post('/api/manorclearance/reward/gain', { stage_level, activity_id }).then(x => !!(x && x.gain_success))
    }

	/**
	 * 获取收益最高的植物
	 */
    async getBestPlant(): Promise<PlantMap> {
        let plants = await this.plantList();
        let max_plant = Object.values(plants.plant_map)
            .filter(x => (x.status == 2 || !x.unlock_lack_amount) && x.plant_type < 100)
            .reduce((a, b) => {
                if (this.mode)
                    return a.life_time > b.life_time ? a : b;
                return a.produce_coin_amount / a.life_time > b.produce_coin_amount / b.life_time ? a : b
            })
        if (max_plant.status != 2) {
            this.log(`解锁植物: ${max_plant.plant_type}`)
            await this.plantUnlock(max_plant.plant_type);
        }
        return max_plant;
    }

	/**
	 * 开始种植
	 * @param land_map 
	 */
    async startPlant(land_map?: { [key: string]: LandMap }) {
        if (!land_map) land_map = await this.queryPortal().then(x => x.land_map);
        let max_plant
        let now = Math.floor(+new Date() / 1e3) - 1;
        let harvest_time = 0;
        for (var k in land_map) {
            var v = land_map[k];
            if (v.status == 1) { // 可以解锁状态
                if (v.unlock_amount > this.coin_amount) // 没地了，退出循环
                    break;
                else {
                    let ret = await this.landUnlock(v.land_id).catch(err => {
                        this.error(`land:${v.land_id} 解锁失败 - ${err.error_msg}`)
                    });
                    if (!ret) break;
                    v = ret.land_map[k]
                }
            }
            if (v.status != 2) continue;
            if (!v.plant_type) { // 空地
                if (!max_plant) max_plant = await this.getBestPlant();
                let ret = await this.plantCreate(max_plant.plant_type, v.land_id);
                v = ret.land_map[k]
                this.log(`种地 land:${v.land_id},plant:${max_plant.plant_type}`)
            }
            if (v.harvest_time > now) { // 等待
                if (!harvest_time || v.harvest_time < harvest_time)
                    harvest_time = v.harvest_time;
            } else { // 可以收了
                harvest_time = now;
                // 收菜需要破解 anti_content
                // 目前测试 anti_content 与接口无关，只有时效限制
                let ret = await this.plantHarvest(v.land_id)
                this.coin_amount = ret.user_info.coin_amount;
                this.log(`收菜${v.land_id}, coin:${this.coin_amount}`)
            }
        }
        this.next_harvest_time = harvest_time;
    }

	/**
	 * 开始完成任务
	 */
    async startMission(mission_info_map: { [key: string]: MissionInfoMap }) {
        let now = Math.floor(+new Date() / 1e3) - 1;
        let map = {
            // 1: "未知",
            // 3: "邀请助力得加速剂",
            4: "每日得加速剂",
            // 5: "拼单得加速剂",
            // 10001: "邀请新用户一起玩",
            // 10002: "寻找宝箱",
            // 10003: "10003",
            // 10004: "10004",
            // 10005: "10005",
            // 10006: "10006",
            // 10007: "10007",
            // 10008: "10008",
        }
        for (let k in map) {
            let name = map[k]
            let share = mission_info_map[k]
            if (share.max_count > share.finish_count && share.next_complete_time < now && await this.missionComplete(+k) && await this.rewardGain(+k)) {
                this.log(`完成任务:【${name}】`)
            }
        }
    }

    log(msg: string) {
        console.log(this.pdduid, msg)
    }

    error(msg: string) {
        console.error(this.pdduid, msg)
    }

    sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async start() {
        if (this.running) return;
        this.log(`启动`);
        this.running = true;
        while (this.running) {
            let now = Math.floor(+new Date() / 1e3);
            let portal = await this.queryPortal().catch(x => this.error(x) as any as QueryPortalResponse);
            if (portal) {
                this.coin_amount = portal.user_info && portal.user_info.coin_amount || 0;
                await this.startPlant(portal.land_map).catch(this.error.bind(this))
                await this.startMission(portal.mission_info_map).catch(this.error.bind(this))
                await this.sleep(Math.min(Math.max(this.next_harvest_time - now, 10), 30) * 1e3)
            } else {
                this.running = false;
                this.onError && this.onError();
            }
        }
    }
}

async function main() {
    config.anti_content = "0anAfxnUXOcYY9dVURBSVHzQg9FngtS_1vCq85HHdyvS_SYwT12_17CIZaWahgYJYHmv3-LCvY7HlvbCfA4Gwlr3eGvi77iLyqY5o996m9i3IEPV96SfaZoWEGCOoB5-ukWWjCq_oDqyrLr5c4QnHiYRIPQ8N91hxi3IO-rOtxxp1T_eVN7xb7PD-SqIdHI5NHxkUT7tvF7MFFYK7IvZFxYdwXhwvpsKpVzNvfz2oi3X5c-VQPCSZb8WmEbJ3L5wmOKML3L7GWc3JWoKVKCCXuPsTEEgR8WsKJVteJ35QMgHTQ6bq_o7WKZzlCa8oHm4McS_n9PJ0U1szedj2bqCqwnXYbbUVQDq88tQfmwGrCbQgGIunpImVWIHSucyLheI3CpNJh3pZSvz3bfrsZAs8dF5h0YR2PQBIiRofwB24cbgMCwKLOBAPVQ-UkfpxtexrLZa0BKx7orMIRbH6CLBuCqUkL1TRawO2cuMYzKQI0JFLns8wQ-jWCZyV6GEwo-1niXoxkLIUVb6efK6qDVvwVg5ciaNk-kqjExs8Pz7bsOLzh3KhOhiZNzJfUO"
    new Pdd('7198455919407', "LNH3FH3IYFZEGJG3G5GOHBMXLNQHPARX4NMW4A6KF6GCRAQFPBKQ1032f82").start();
    new Pdd('6187437120', "D4JQGQXXBIDPR5F4BNG5DOGF7ATFXZM4AMH6PBFI5DYSU5TWM6GQ10040a8").start();
}

if (require.main === module)
    main()

interface PlantSpeedupResponse {
    server_time: number;
    land_map: { [key: string]: LandMap };
}

interface PlantHavestResponse {
    server_time: number;
    land_map: { [key: string]: LandMap };
    user_info: UserInfo;
    harvest_amount: number;
    loss_amount: number;
}

interface LandUnlockResponse {
    server_time: number;
    land_map: { [key: string]: LandMap };
    user_info: UserInfo;
}

interface PlantListResponse {
    server_time: number;
    plant_map: { [key: string]: PlantMap };
    coin_amount: number;
    can_upgrade_farm_level: boolean;
}

interface CreateResponse {
    server_time: number;
    land_map: { [key: string]: LandMap };
    coin_amount: number;
}

interface PlantUnlockResponse {
    server_time: number;
    plant_map: { [key: string]: PlantMap };
}

interface PlantMap {
    plant_type: number;
    seed_amount: number;
    status: number;
    life_time: number;
    produce_coin_amount: number;
    unlock_lack_amount?: number;
}

interface QueryPortalResponse {
    server_time: number;
    land_map: { [key: string]: LandMap };
    user_info: UserInfo;
    property_list: any[];
    popup_list: PopupList[];
    icon_info_list: IconInfoList[];
    mission_info_map: { [key: string]: MissionInfoMap };
    can_use_contact: boolean;
    not_show_group: boolean;
    increase_production_ratio: number;
    increase_production_agentia_amount: number;
    temp_unlock_info_map: { [key: string]: TempUnlockInfoMap };
    can_temp_unlock: boolean;
    freshman_mission_status: number;
}

interface IconInfoList {
    icon_type: number;
    is_show: boolean;
}

interface LandMap {
    land_id: number;
    status: number;
    plant_type?: number;
    harvest_time?: number;
    life_time?: number;
    harvest_total_amount?: number;
    loss_amount?: number;
    use_increase_production_agentia: boolean;
    land_unlock_expire_time?: number;
    unlock_amount?: number;
}

interface MissionInfoMap {
    mission_type: number;
    finish_count: number;
    draw_count: number;
    next_complete_time: number;
    max_count: number;
    is_drawable: boolean;
    reward_result: RewardResult[];
    is_unlimited: boolean;
}

interface RewardResult {
    reward_type: number;
    min_reward_amount: number;
    max_reward_amount: number;
}

interface PopupList {
    popup_type: number;
}

interface TempUnlockInfoMap {
    land_id: number;
    cost_coin_amount: number;
    unlock_days_by_coin: number;
    unlock_days_by_pay: number;
}

interface UserInfo {
    coin_amount: number;
    total_coin_amount: number;
    need_new_user_guide: boolean;
    farm_level: number;
    upgrade_finish_time: number;
    upgrade_need_time: number;
    farm_status: number;
}

interface WaterGainResponse {
    water_amount: number;
    gain_amount: number;
    mission_list: { [key: string]: MissionList };
    twice_bag_share_vo: null;
    server_time: number;
}

interface MissionList {
    type: number;
    finished_count: number;
    drawed_count: number;
    next_available_time: number;
    max_count: number | null;
    reward_amount: number;
    extra_reward_amount: number;
    min_reward_amount: null;
    max_reward_amount: null;
    mission_interval: number;
    is_draw: boolean;
    is_open: boolean;
    extra_info: ExtraInfo | null;
    need_share: boolean;
    share_rule_list: any[];
}

interface ExtraInfo {
    ab_test: string;
}
