# backslack

Bridge between [Backlog](http://www.backlog.jp/help/adminsguide/webhook-setting/userguide2493.html) and [Slack](https://api.slack.com/incoming-webhooks)

![img](ss.png)

## Usage

### 1. Deploy backslack

```
$ yarn
$ AWS_PROFILE=XXxxxxX $(npm bin)/sls deploy
```

### 2. Get backslack endpoint URL

```
$ AWS_PROFILE=XXxxxxX $(npm bin)/sls info
...
Service Information
service: backslack
stage: v0
region: ap-northeast-1
api keys:
  None
endpoints:
  POST - https://x0x1x2x3x.execute-api.ap-northeast-1.amazonaws.com/v0/hook # <- Use this URL
functions:
  backslack-v0-hook
```

|                    | Value                                                                |
| ------------------ |:---------------------------------------------------------------------|
| backslack endpoint | `https://x0x1x2x3x.execute-api.ap-northeast-1.amazonaws.com/v0/hook` |

### 3. Get Slack incoming webhook URL

https://api.slack.com/incoming-webhooks

`https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

|                            | Value                                                                           |
| -------------------------- |:--------------------------------------------------------------------------------|
| Slack incoming webhook URL | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX` |

### 4. Add Backlog webhook

http://www.backlog.jp/help/adminsguide/webhook-setting/userguide2496.html

Webhook URL: `https://x0x1x2x3x.execute-api.ap-northeast-1.amazonaws.com/v0/hook?space=myspace&webhook_url=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX&channel=general`

#### URL Query Parameters

| Key                    | Value                      | Example                    |
| -----------------------|:---------------------------|:---------------------------|
| space (required)       | [Backlog space id](http://www.backlog.jp/faq/service/what-id.html) | `myspace` |
| webhook_url (required) | Slack incoming webhook URL | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX` |
| channel                | Slack channel              | `general` |
