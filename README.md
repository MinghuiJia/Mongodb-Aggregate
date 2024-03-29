# mongodb_aggregate_data_process
该项目是使用nodejs的puppeteer库实现对请求拦截，从而拦截返回的响应数据完成数据抓取的
- 数据处理流程
    - 在MongoDB Compass上执行聚合操作
        ```
        {
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "_id.answer_id",
                    as: "comments",
                },
            },
            {
                $project: {
                    _id: 1,
                    target_type: 1,
                    author_name: "$target.author.name",
                    content: "$target.content",
                    created_time: "$target.created_time",
                    question_title: "$target.question.title",
                    voteup_count: "$target.voteup_count",
                    comment_count: "$target.comment_count",
                    comments: 1,
                },
            },
            {
                $out: {
                    db: "test",
                    coll: "answers_with_comments_select_features",
                },
            },
        }
        ```
        - 完成之后会生成“answers_with_comments_select_features”集合，里面包含需要的字段信息
    - 然后执行项目中的aggregateOp.ts代码，会将“answers_with_comments_select_features”集合中的comments内嵌套的child_comments展开，全部以对象的形式存储在comments数组中，同时去除回答文本中的html标签，得到纯文本，最终得到“answers_with_comments_select_features_flat_comments”集合
    - 然后执行项目中的flatten.ts代码，将“answers_with_comments_select_features_flat_comments”集合中的comments都按照回答展示，这个是另一种excel展现形式用到的
        - 在这种展现形式基础上，需要在mongodb上再进行时间格式化，使用project
            ```
                /**
                * specifications: The fields to
                *   include or exclude.
                */
                {
                    _id: 1,
                    answer_id: 1,
                    comment_id: 1,
                    target_type: 1,
                    author_name: 1,
                    content: 1,
                    created_time_formatted: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {
                                $toDate: {
                                    $multiply: ["$created_time", 1000],
                                },
                            },
                        },
                    },
                    question_title: 1,
                    voteup_count: 1,
                    comment_count: 1,
                }
            ```
        - 然后保存集合，使用out
            ```
            {
                db: 'test',
                coll: 'formatted1',
            }
            ```
    - 再基于“answers_with_comments_select_features_flat_comments”集合进行日期时间戳的格式化，从时间戳变成"%Y-%m-%d %H:%M:%S"，受用project
        ```
        /**
        * specifications: The fields to
        *   include or exclude.
        */
        {
            _id: 1,
            target_type: 1,
            comments: {
                $map: {
                    input: "$comments",
                    as: "comment",
                    in: {
                        comment_id: "$$comment.comment_id",
                        comment_type: "$$comment.comment_type",
                        comment_author_name:
                        "$$comment.comment_author_name",
                        comment_content:
                        "$$comment.comment_content",
                        comment_created_time_formatted: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {
                                    $toDate: {
                                        $multiply: [
                                            "$$comment.comment_created_time",
                                            1000,
                                        ],
                                    },
                                },
                            },
                        },
                        comment_like_count:
                        "$$comment.comment_like_count",
                        comment_voteup_count:
                        "$$comment.comment_voteup_count",
                    },
                },
            },
            author_name: 1,
            content: 1,
            created_time_formatted: {
                $dateToString: {
                    format: "%Y-%m-%d %H:%M:%S",
                    date: {
                        $toDate: {
                            $multiply: ["$created_time", 1000],
                        },
                    },
                },
            },
            question_title: 1,
            voteup_count: 1,
            comment_count: 1,
        }
        ```
    - 最后使用out保存
        ```
        {
            db: 'test',
            coll: 'formatted2',
        }
        ```