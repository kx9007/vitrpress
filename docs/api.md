---
title: API 站点
description: api.kxlove.top 提供的自建接口，含 Base URL、参数与调用示例
# 保留右侧大纲，只放宽正文容器
pageClass: page-wide
---

# API 站点

这里是我自建的一组接口，统一挂在 `api.kxlove.top` 下。点「接口文档」可以看完整的参数表、cURL 示例和返回结构，Base URL 点一下就复制。

<ApiShowcase />

## 使用说明

所有接口都是**免密钥**的，直接 GET 就能调。以 Bing 每日一图为例：

```bash
# 拿 JSON 元信息
curl 'https://api.kxlove.top/api/bing-img/index.php?type=json'

# 直接当图片地址用（默认 1080P，加 img=4k 取原图）
curl 'https://api.kxlove.top/api/bing-img/index.php?img=4k' -o today.jpg
```

在网页里更省事，直接丢进 `<img>` 即可：

```html
<img src="https://api.kxlove.top/api/bing-img/index.php" alt="每日一图" />
```

## 关于稳定性

- **图片、天气、IP 归属地**：底层是 Bing / 腾讯天气等公开数据源，最稳
- **各类去水印解析**（抖音、小红书、B 站、快手）：依赖上游站点，**上游改版就会失效**，且短时间内不能大量请求，否则会被风控
- **M3U8 解析**：只认量子、非凡、暴风三类采集源，其他地址会直接返回 `解析失败`

::: warning 请勿滥用
这些接口都跑在一台小机器上，没有做配额限制。请控制调用频率，尤其是解析类接口，高频请求会导致上游封禁。
:::

## 注意事项

- **解析类接口的结果只做技术演示**，请勿用于商业分发，注意原平台的版权与使用条款
- 网易云音乐的几个接口里，歌曲 / 歌单 / 专辑 ID 目前是**写死在源码里的**，要查别的内容需要自己改 PHP；只有搜索（`word`）和取播放地址（`id`、`quality`）能传参
- QQ 音乐解析会在一次请求里把所有音质都试一遍，没有账号权限的音质返回空值，删掉即可
- 返回体格式不完全统一：有的包一层 `code`/`msg`，有的直接返回数据本身，具体以每个接口的「返回示例」为准
