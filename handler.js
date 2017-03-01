'use strict';

const axios = require('axios');
const types = {
    1: '課題の追加',
    2: '課題の更新',
    3: '課題にコメント',
    4: '課題の削除',
    5: 'Wikiを追加',
    6: 'Wikiを更新',
    7: 'Wikiを削除',
    8: '共有ファイルを追加',
    9: '共有ファイルを更新',
    10: '共有ファイルを削除',
    11: 'Subversionコミット',
    12: 'GITプッシュ',
    13: 'GITリポジトリ作成',
    14: '課題をまとめて更新',
    15: 'プロジェクトに参加',
    16: 'プロジェクトから脱退',
    17: 'コメントにお知らせを追加',
    18: 'プルリクエストの追加',
    19: 'プルリクエストの更新',
    20: 'プルリクエストにコメント',
    21: 'プルリクエストの削除',
    22: 'マイルストーンの追加',
    23: 'マイルストーンの更新',
    24: 'マイルストーンの削除'
};

module.exports.hook = (event, context, callback) => {
    console.log(event);
    console.log(context);

    const webhookUrl = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('webhook_url') ? event.queryStringParameters.webhook_url : null;
    const space = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('space') ? event.queryStringParameters.space : null;
    const channel = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('channel') ? '#' + event.queryStringParameters.channel : '#general';
    const username = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('username') ? event.queryStringParameters.username : 'backslack';
    
    if (!webhookUrl) {
        const response = {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid argument'
            })
        };
        callback(null, response);
        return;
    }

    const body = JSON.parse(event.body);

    const type = body.type;
    let pretext = types[type];
    let authorName = body.createdUser.name;
    let title = null;
    let title_link = null;
    let text = null;
    let prefix = 'UNKNOWN';
    let fields = [];
    let footer = 'UNKNOWN';
    let date = new Date(body.created);

    if (body.hasOwnProperty('project')) {
        prefix = body.project.projectKey;
        footer = body.project.name;
    }

    if (body.content.hasOwnProperty('summary')) {
        title = body.content.summary;
    }
    if (body.content.hasOwnProperty('key_id')) {
        title = '[' + prefix + '-' + body.content.key_id + '] ' + title;
        if (space) {
            title_link = 'https://' + space + '.backlog.jp/view/' + prefix + '-' + body.content.key_id;
        }
    }
    
    // 3. 課題にコメント
    if (type == 3) {
        if (body.content.hasOwnProperty('comment') && body.content.comment.content != '') {
            fields.push(
                {
                    title: 'コメント',
                    value: body.content.comment.content,
                    short: false
                }
            );
        }
        if (space) {
            text = 'https://' + space + '.backlog.jp/view/' + prefix + '-' + body.content.key_id + '#comment-' + body.content.comment.id;
        }
    }

    // 1,2,4 課題の*    
    if ([1,2,4].some(function(v) { return v == type; })) { 
        if (body.content.hasOwnProperty('description') && body.content.description != '') {
            fields.push(
                {
                    title: '詳細',
                    value: body.content.description,
                    short: false
                }
            );
        }
    }
    
    if (body.content.hasOwnProperty('issueType')) {
        fields.push(
            {
                title: '種別',
                value: body.content.issueType.name,
                short: true
            }
        );
    }

    if (body.content.hasOwnProperty('status')) {
        fields.push(
            {
                title: 'ステータス',
                value: body.content.status.name,
                short: true
            }
        );
    }

    if (body.content.hasOwnProperty('milestone')) {
        const milestone = body.content.milestone.map(function(v) {
            return v.name;
        }).join(', ');
        fields.push(
            {
                title: 'マイルストーン',
                value: milestone,
                short: true
            }
        );
    }
    
    if (body.content.hasOwnProperty('assignee')) {
        fields.push(
            {
                title: '担当者',
                value: body.content.assignee.name,
                short: true
            }
        );
    }
    
    // Slack
    let data = {
        channel: channel,
        username: username,
        attachments: [
            {
                fallback: pretext + ' by ' + authorName,
                pretext: pretext,
                author_name: authorName,
                title: title,
                title_link: title_link,
                text: text,
                fields: fields,
                footer: footer,
                color: '#57d9b2',
                ts: (date.getTime() / 1000)
            }
        ]
    };

    axios.post(webhookUrl, data)
        .then((res) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Successfully!'
                })
            };
            callback(null, response);
        })
        .catch((err) => {
            const response = {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Slack POST error.'
                })
            };
            callback(null, response);
        });
    
    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
