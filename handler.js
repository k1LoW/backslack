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
    12: 'Gitプッシュ',
    13: 'Gitリポジトリ作成',
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

    const space = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('space') ? event.queryStringParameters.space : null;
    const webhookUrl = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('webhook_url') ? event.queryStringParameters.webhook_url : null;
    const channel = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('channel') ? '#' + event.queryStringParameters.channel : '#general';
    const username = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('username') ? event.queryStringParameters.username : 'backslack';

    if (!space || !webhookUrl) {
        const response = {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid argument. `space` and `webhook_url` is required'
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
        title_link = 'https://' + space + '.backlog.jp/view/' + prefix + '-' + body.content.key_id;
    }

    // マイルストーン
    if ([22,23,24].some(function(v) { return v == type; })) {
        if (body.content.hasOwnProperty('name') && body.content.name != '') {
            fields.push(
                {
                    title: 'マイルストーン',
                    value: body.content.name,
                    short: false
                }
            );
        }
    }
    
    // 詳細
    if ([1,2,4,18,19,22,23].some(function(v) { return v == type; })) {
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
    
    // コメント
    if ([2, 3, 17].some(function(v) { return v == type; })) {
        if (body.content.hasOwnProperty('comment') && body.content.comment.content != '') {
            fields.push(
                {
                    title: 'コメント',
                    value: body.content.comment.content,
                    short: false
                }
            );
        }
        text = 'https://' + space + '.backlog.jp/view/' + prefix + '-' + body.content.key_id + '#comment-' + body.content.comment.id;
    }

    // Wiki
    if ([5,6,7].some(function(v) { return v == type; })) {
        if (body.content.hasOwnProperty('name') && body.content.name != '') {
            fields.push(
                {
                    title: 'Wiki',
                    value: body.content.name,
                    short: false
                }
            );
        }
    }

    // 共有ファイル
    if ([8,9,10].some(function(v) { return v == type; })) {
        if (body.content.hasOwnProperty('name') && body.content.name != '') {
            fields.push(
                {
                    title: '共有ファイル',
                    value: body.content.name,
                    short: false
                }
            );
        }
    }

    // Subversion
    if ([11].some(function(v) { return v == type; })) {
        if (body.content.hasOwnProperty('rev') && body.content.rev != '') {
            fields.push(
                {
                    title: 'リビジョン',
                    value: body.content.rev,
                    short: true
                }
            );
        }
        if (body.content.hasOwnProperty('comment') && body.content.comment != '') {
            fields.push(
                {
                    title: 'コメント',
                    value: body.content.comment,
                    short: false
                }
            );
        }        
    }

    // Git
    if ([12,13,18,19,20,21].some(function(v) { return v == type; })) {
        
        if (body.content.hasOwnProperty('repository')) {
            fields.push(
                {
                    title: 'リポジトリ',
                    value: body.content.repository.name,
                    short: true
                }
            );
        }
    }

    // プロジェクト参加
    if ([15,16].some(function(v) { return v == type; })) {
        const users = body.content.users.map(function(v) {
            return v.name;
        }).join(', ');
        if (body.content.hasOwnProperty('users')) {
            fields.push(
                {
                    title: 'ユーザ',
                    value: users,
                    short: true
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

    if (body.content.hasOwnProperty('versions')) {
        const versions = body.content.versions.map(function(v) {
            return v.name;
        }).join(', ');
        fields.push(
            {
                title: '発生バージョン',
                value: versions,
                short: true
            }
        );
    }
    
    if (body.content.hasOwnProperty('category')) {
        const category = body.content.category.map(function(v) {
            return v.name;
        }).join(', ');
        fields.push(
            {
                title: 'カテゴリー',
                value: category,
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

    if (body.content.hasOwnProperty('assignee') && body.content.assignee) {
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
                    message: 'Success!'
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
};
