/**
 * API 站点数据 —— 接口文档页的唯一数据源
 *
 * 全部内容来自 `api.kxlove.top` 备份包中的真实实现，
 * 字段对应关系：
 *   title/description/tag/method/ps  ← 各模块 index.json
 *   request                          ← index.json 的 request 定义
 *   example                          ← index.json 的 example（长签名 URL 已截断，仅示意）
 *   blbl / ks / video / wyy          ← 直接读 PHP 源码，无 index.json 的模块据此补齐
 *
 * 数据结构刻意与 ApiShowcase.vue 解耦前保持一致，
 * 这样组件、样式、交互都不用改。
 */

type Param = {
  name: string
  type: string
  required: boolean
  desc: string
}

type Endpoint = {
  method: string
  path: string
  desc: string
  params: Param[]
  response: string
}

type Site = {
  name: string
  url: string
  baseUrl: string
  desc: string
  category: string
  models: string[]
  status: 'online' | 'unstable' | 'maintenance' | 'offline'
  pricing: string
  docs?: string
  featured?: boolean
  endpoints: Endpoint[]
}

const HOST = 'https://api.kxlove.top'
const DOC = (folder: string) => `${HOST}/api.php?api=${folder}`

export const apiSites: Site[] = [
  {
    name: 'Bing 每日一图',
    url: `${HOST}/api/bing-img/index.php`,
    baseUrl: `${HOST}/api/bing-img/index.php`,
    desc: '获取 Bing 每日壁纸，可返回 JSON 元信息，也可直接 302 到图片。数据由 Bing 官方提供。',
    category: '图片壁纸',
    models: ['壁纸', 'bing', '每日一图'],
    status: 'online',
    pricing: '免费',
    docs: DOC('bing-img'),
    featured: true,
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '不带参数默认返回 JSON；不带 type=json 时直接输出图片流，可直接用作 <img> 或 CSS 背景。',
        params: [
          { name: 'type', type: 'string', required: false, desc: '填 json 返回 JSON；留空则直接输出图片' },
          { name: 'img', type: 'string', required: false, desc: '留空输出 1920×1080；填 4k 输出 UHD 原图' },
          { name: 'time', type: 'string', required: false, desc: '取第几张历史图，范围 1~7；不填为今天' },
        ],
        response: `{
  "url": "https://www.bing.com/th?id=OHR.BerrySquirrel_ZH-CN7382553646_1920x1080.jpg",
  "url_4k": "https://www.bing.com/th?id=OHR.BerrySquirrel_ZH-CN7382553646_UHD.jpg",
  "copyright": "欧亚红松鼠 (© Galina Jacyna/Getty Images)",
  "title": "冬日白雪中的一抹红",
  "code": 200,
  "msg": "获取成功",
  "time": "2026-01-21 21:08:24"
}`,
      },
    ],
  },

  {
    name: '抖音视频图集解析',
    url: `${HOST}/api/dy/index.php`,
    baseUrl: `${HOST}/api/dy/index.php`,
    desc: '传入抖音分享链接，返回无水印视频地址、封面、作者信息与背景音乐。图文作品返回图集。',
    category: '视频解析',
    models: ['抖音', '去水印', '文件下载'],
    status: 'online',
    pricing: '免费',
    docs: DOC('dy'),
    featured: true,
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '短视频返回 play 地址，图文作品返回 images 数组。短时间内不要大量请求。',
        params: [
          { name: 'url', type: 'string', required: true, desc: '抖音短视频或图集的分享链接' },
        ],
        response: `{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "author": "狐语野性",
    "uid": 90438532652,
    "avatar": "https://p11.douyinpic.com/aweme-avatar/....jpeg",
    "like": 300,
    "time": 1769251253,
    "title": "那些小众的爱好、无用的美好……",
    "cover": "https://p26-sign.douyinpic.com/tos-cn-i-dy/....webp",
    "images": "当前为短视频解析模式",
    "url": "https://aweme.snssdk.com/aweme/v1/play/?video_id=....&ratio=720p",
    "music": {
      "title": "@狐语野性创作的原声",
      "author": "狐语野性",
      "avatar": "https://p11.douyinpic.com/aweme-avatar/....jpeg",
      "url": "v0300fg10000d5qa20vog65pld9vr1pg"
    }
  }
}`,
      },
    ],
  },

  {
    name: '小红书视频图集解析',
    url: `${HOST}/api/xhs/index.php`,
    baseUrl: `${HOST}/api/xhs/index.php`,
    desc: '传入小红书笔记链接，返回无水印视频或图集、封面、作者与正文描述。',
    category: '视频解析',
    models: ['小红书', '去水印', '文件下载'],
    status: 'online',
    pricing: '免费',
    docs: DOC('xhs'),
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '解析笔记本体，返回直链。短时间内不要大量请求。',
        params: [
          { name: 'url', type: 'string', required: true, desc: '小红书短视频或图集链接' },
        ],
        response: `{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "author": "蛋卷做饭日记",
    "authorID": "63f22930000000001001e188",
    "title": "打工人下班如何快速吃上饭",
    "desc": "今天吃番茄年糕汤 #一人食吃什么 #美食日常",
    "avatar": "https://sns-avatar-qc.xhscdn.com/avatar/....jpg",
    "cover": "http://sns-webpic-qc.xhscdn.com/....jpg",
    "url": "http://sns-bak-v8.xhscdn.com/stream/110/258/....mp4"
  }
}`,
      },
    ],
  },

  {
    name: '哔哩哔哩无水印解析',
    url: `${HOST}/api/blbl/index.php`,
    baseUrl: `${HOST}/api/blbl/index.php`,
    desc: '从 B 站链接中提取 BV 号，返回标题、封面、UP 主与播放地址。不登录时通常只能拿到 480P 以下的合并流。',
    category: '视频解析',
    models: ['B站', '去水印', 'BV号解析'],
    status: 'online',
    pricing: '免费',
    featured: true,
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '链接里必须含 BV 号。服务端固定请求 qn=112（1080P60）；但当前代码里的 SESSDATA 是占位值，未登录状态下 B 站通常只返回 480P 以下的 mp4，想要高画质需自己在源码里填有效 Cookie。',
        params: [
          { name: 'url', type: 'string', required: true, desc: '包含 BV 号的 B 站视频链接' },
        ],
        response: `{
  "code": 200,
  "message": "提取成功",
  "data": {
    "bvid": "BV1xx411c7mD",
    "cid": 123456789,
    "pic": "http://i2.hdslb.com/bfs/archive/....jpg",
    "title": "视频标题",
    "desc": "视频简介",
    "owner": {
      "name": "UP主昵称",
      "face": "https://i0.hdslb.com/bfs/face/....jpg"
    },
    "play_url": "https://upos-sz-mirror....bilivideo.com/....mp4"
  }
}`,
      },
    ],
  },

  {
    name: '快手视频解析',
    url: `${HOST}/api/ks/index.php`,
    baseUrl: `${HOST}/api/ks/index.php`,
    desc: '跟随跳转拿到快手作品真实页面，提取封面与无水印视频直链，同时返回作者昵称。',
    category: '视频解析',
    models: ['快手', '去水印', '文件下载'],
    status: 'online',
    pricing: '免费',
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '先解析短链跳转，再抓取页面里的视频源。参数名是 url。',
        params: [
          { name: 'url', type: 'string', required: true, desc: '快手作品链接（含短链 v.kuaishou.com）' },
        ],
        response: `{
  "code": 200,
  "msg": "获取成功",
  "cover": "https://p2.a.yximgs.com/upic/....jpg",
  "mp4": "https://v1.kwaicdn.com/upic/....mp4",
  "anthor": "作者昵称"
}`,
      },
    ],
  },

  {
    name: 'M3U8 播放源解析',
    url: `${HOST}/api/video/index.php`,
    baseUrl: `${HOST}/api/video/index.php`,
    desc: '针对量子、非凡、暴风三类采集源的 m3u8 地址做去广告代理，返回可直接播放的地址，并按 URL 做了缓存。',
    category: '视频解析',
    models: ['m3u8', '去广告', '缓存'],
    status: 'online',
    pricing: '免费',
    docs: DOC('video'),
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '仅接受含 .m3u8 的地址，且域名特征需命中量子（lz-/cdnlz）、非凡（ffzy/play）或暴风（cdnbf/bbffcdn）。命中缓存时 msg 为「缓存」。',
        params: [
          { name: 'url', type: 'string', required: true, desc: '原始 m3u8 播放地址' },
        ],
        response: `{
  "code": 200,
  "msg": "成功解析",
  "domain": "去广告",
  "type": "m3u8",
  "url": "https://api.kxlove.top/DADCache/LZ/9f2c....m3u8",
  "ip": "223.95.30.52"
}`,
      },
    ],
  },

  {
    name: 'GitHub 文件加速',
    url: `${HOST}/api/github/index.php`,
    baseUrl: `${HOST}/api/github/index.php`,
    desc: '为 GitHub 的 Release、源码包等文件提供多条 CDN 线路加速下载，可选直接 302 跳转。',
    category: '工具',
    models: ['github', '加速', '文件下载'],
    status: 'online',
    pricing: '免费',
    docs: DOC('github'),
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: 'choose 可选 1~8，对应不同代理线路。type=302 时浏览器直接开始下载。',
        params: [
          { name: 'url', type: 'string', required: true, desc: 'GitHub 文件原始 URL' },
          { name: 'type', type: 'string', required: false, desc: 'json（默认）或 302 直接下载' },
          { name: 'choose', type: 'string', required: false, desc: '线路 1~8，默认 1：1 香港 / 2 EdgeOne / 3 Cloudflare / 4 IPv6 / 5 Fastly / 6 日本 / 7 韩国 / 8 韩国 kr1-proxy' },
        ],
        response: `{
  "code": 200,
  "msg": "获取成功",
  "download_url": "https://hk.gh-proxy.org/https://github.com/sky22333/hubproxy/archive/refs/tags/v1.1.8.zip?type=302"
}`,
      },
    ],
  },

  {
    name: '随机一言',
    url: `${HOST}/api/random-saying/saying.php`,
    baseUrl: `${HOST}/api/random-saying/saying.php`,
    desc: '从语录库随机取一条，可指定分类文本文件与返回条数，支持 json / text 两种格式。',
    category: '工具',
    models: ['随机一言', '语录', '随机'],
    status: 'online',
    pricing: '免费',
    docs: DOC('random-saying'),
    featured: true,
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '默认以纯文本返回一句话；type=json 时返回带 code/msg/result 的结构。',
        params: [
          { name: 'type', type: 'string', required: false, desc: 'json 或 text，默认 text' },
          { name: 'text', type: 'string', required: false, desc: '指定语录文本文件，默认随机' },
          { name: 'number', type: 'integer', required: false, desc: '指定返回第几条，默认随机' },
        ],
        response: `{
  "code": 200,
  "msg": "获取成功",
  "result": "刚修复一个 bug，又引出十个新 bug"
}`,
      },
    ],
  },

  {
    name: 'IP 归属地查询',
    url: `${HOST}/api/local/index.php`,
    baseUrl: `${HOST}/api/local/index.php`,
    desc: '查询 IP 的国家、省、市与运营商。不传 ip 时自动取请求方 IP，适合做访客定位。',
    category: '工具',
    models: ['归属地查询', 'ip', '地理定位'],
    status: 'online',
    pricing: '免费',
    docs: DOC('local'),
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '不传 ip 即查自己。频率不要过高，否则会被上游限流。',
        params: [
          { name: 'ip', type: 'string', required: false, desc: '要查询的 IPv4 地址，留空则自动获取请求方 IP' },
        ],
        response: `{
  "ip": "223.95.30.52",
  "country": "中国",
  "province": "浙江省",
  "city": "绍兴市",
  "region": "",
  "isp": "浙江省绍兴市 移动",
  "code": "200",
  "message": "查询成功"
}`,
      },
    ],
  },

  {
    name: '天气预报',
    url: `${HOST}/api/weather/index.php`,
    baseUrl: `${HOST}/api/weather/index.php`,
    desc: '返回指定 IP 所在地的实时天气与 24 小时预报，数据来自腾讯天气。含温湿度、气压、风力风向。',
    category: '工具',
    models: ['天气', '气象', '实时数据'],
    status: 'online',
    pricing: '免费',
    docs: DOC('weather'),
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '先由 IP 定位城市，再取该市天气。不传 ip 时用请求方 IP。',
        params: [
          { name: 'ip', type: 'string', required: false, desc: '用于定位城市的 IP，留空则自动获取' },
        ],
        response: `{
  "code": 200,
  "ip_info": {
    "ip": "223.95.30.52",
    "country": "中国",
    "province": "浙江省",
    "city": "绍兴市",
    "region": "",
    "isp": "浙江省绍兴市 移动"
  },
  "weather": {
    "degree": "1",
    "humidity": "80",
    "precipitation": "0",
    "pressure": "1030",
    "update_time": "2026-01-20 17:15",
    "weather": "阴",
    "weather_code": "02",
    "weather_short": "阴",
    "wind_direction": "8",
    "wind_power": "4-5",
    "wind_direction_name": "北风"
  }
}`,
      },
    ],
  },

  {
    name: '网易云音乐 API',
    url: `${HOST}/wyy/`,
    baseUrl: `${HOST}/wyy`,
    desc: '网易云音乐的搜索、歌曲详情、歌词、歌单、专辑与播放地址一整套接口，服务端内置 Cookie 取高音质。',
    category: '音乐',
    models: ['网易云', '歌词', '高音质'],
    status: 'online',
    pricing: '免费',
    featured: true,
    endpoints: [
      {
        method: 'GET',
        path: '/getSearchMusic.php',
        desc: '按关键词搜索歌曲，固定返回 100 条，从第 0 条开始。返回网易云原始结构。',
        params: [
          { name: 'word', type: 'string', required: false, desc: '搜索关键词，不传默认「薛之谦」' },
        ],
        response: `{
  "result": {
    "songs": [
      {
        "id": 2006535009,
        "name": "歌曲名",
        "ar": [{ "name": "歌手" }],
        "al": { "name": "专辑", "picUrl": "https://p1.music.126.net/....jpg" }
      }
    ],
    "songCount": 100
  },
  "code": 200
}`,
      },
      {
        method: 'GET',
        path: '/getSongDetail.php',
        desc: '取单曲详情。注意：歌曲 ID 在服务端硬编码为 2006535009，当前不接受参数，需改源码才能查别的歌。',
        params: [],
        response: `{
  "data": {
    "id": 2006535009,
    "name": "歌曲名",
    "album": "专辑名",
    "singer": "歌手A/歌手B",
    "picimg": "https://p1.music.126.net/....jpg"
  }
}`,
      },
      {
        method: 'GET',
        path: '/getLyric.php',
        desc: '取歌词，同时返回翻译、罗马音与逐字滚动歌词。歌曲 ID 同样为硬编码。',
        params: [],
        response: `{
  "data": {
    "lrc": "[00:00.000] 作词 : ...",
    "tlyric": "[00:00.000] 翻译歌词",
    "romalrc": "[00:00.000] romaji",
    "klyric": "[00:00.000] 逐字歌词"
  }
}`,
      },
      {
        method: 'GET',
        path: '/getPlaylistDetail.php',
        desc: '取歌单详情与完整曲目列表，歌单 ID 硬编码为 5202687076。',
        params: [],
        response: `{
  "data": {
    "id": 5202687076,
    "name": "歌单名称",
    "coverImgUrl": "https://p1.music.126.net/....jpg",
    "trackCount": 100,
    "creator": { "nickname": "创建者" },
    "tracks": [{ "id": 208891, "name": "歌曲名" }]
  }
}`,
      },
      {
        method: 'GET',
        path: '/getAlbumDetail.php',
        desc: '取专辑详情，直接透传网易云原始专辑对象。专辑 ID 硬编码为 2532181。',
        params: [],
        response: `{
  "album": {
    "id": 2532181,
    "name": "专辑名",
    "picUrl": "https://p1.music.126.net/....jpg",
    "artist": { "name": "歌手" }
  },
  "songs": [{ "id": 208891, "name": "歌曲名" }],
  "code": 200
}`,
      },
      {
        method: 'GET',
        path: '/getMusicUrl.php',
        desc: '取歌曲播放直链。这是整套接口里最常用的一个，注意返回体没有 code 包装，直接就是地址对象。',
        params: [
          { name: 'id', type: 'string', required: false, desc: '歌曲 ID，默认 208891' },
          { name: 'quality', type: 'string', required: false, desc: '音质，默认 standard；可选 higher / exhigh / lossless / jymaster 等' },
        ],
        response: `{
  "id": 208891,
  "url": "https://m801.music.126.net/....mp3",
  "br": 320000,
  "level": "exhigh",
  "size": 10240000,
  "md5": "a1b2c3d4e5f6..."
}`,
      },
    ],
  },

  {
    name: 'QQ 音乐解析',
    url: `${HOST}/qq/qq.php`,
    baseUrl: `${HOST}/qq/qq.php`,
    desc: '传一首 QQ 音乐的歌曲页链接，返回曲名、歌手、封面、时长、歌词，以及 13 种音质（128k 到臻品母带）的下载直链。',
    category: '音乐',
    models: ['QQ音乐', '歌词', '无损', '母带'],
    status: 'online',
    pricing: '免费',
    endpoints: [
      {
        method: 'GET',
        path: '',
        desc: '一次请求会把全部音质都试一遍，返回里 music_url 的 key 就是音质名。没有权限的音质会是空值或缺失。',
        params: [
          { name: 'url', type: 'string', required: false, desc: 'QQ 音乐歌曲页链接，如 https://y.qq.com/n/ryqq/songDetail/0039MnYb0qxYhV；不传则用内置默认歌曲' },
        ],
        response: `{
  "music_info": {
    "name": "歌曲名",
    "album": "专辑名",
    "singer": "歌手A, 歌手B",
    "pic": "https://y.qq.com/music/photo_new/T002R800x800M000....jpg",
    "mid": "0039MnYb0qxYhV",
    "id": 123456789,
    "interval": "4:08"
  },
  "music_url": {
    "flac":  { "url": "https://isure.stream.qqmusic.qq.com/F000....flac", "bitrate": "FLAC" },
    "320":   { "url": "https://isure.stream.qqmusic.qq.com/M800....mp3",  "bitrate": "320kbps" },
    "128":   { "url": "https://isure.stream.qqmusic.qq.com/M500....mp3",  "bitrate": "128kbps" }
  },
  "music_lyric": {
    "lyric": "[00:00.000] 作词 : ...",
    "tylyric": "[00:00.000] 翻译歌词"
  }
}`,
      },
    ],
  },
]
