import { MongoClient } from "mongodb";

// 设置mongodb相关的配置信息
const username = "root"; // 用户名
const password = "123456"; // 密码
const url = `mongodb://${username}:${password}@localhost:27017`;

// 创建mongodb客户端对象
const client = new MongoClient(url);
// 设置数据库的名称和集合名称，插入过程中如果不存在会自动创建
const dbName = "test";

const flattenAnswersAndComments = async (db) => {
  const answers = await db.collection("answers_with_comments_select_features_flat_comments").find({}).toArray();

  let result = [];
  answers.forEach((answer) => {
    if (answer.comments) {
      answer.comments.forEach((comment) => {
        const tempObj = {
          answer_id: answer._id,
          comment_id: comment["comment_id"],
          target_type: comment["comment_type"],
          author_name: comment["comment_author_name"],
          content: comment["comment_content"],
          created_time: comment["comment_created_time"],
          voteup_count: comment["comment_voteup_count"],
          comment_count: comment["comment_comment_count"],
          question_title: answer["question_title"],
          // The rest of the fields you need...
        };
        console.log(tempObj);
        result.push(tempObj);
      });
    }
    const temp_answer = {
      _id: answer._id,
      target_type: answer["target_type"],
      author_name: answer["author_name"],
      content: answer["content"],
      created_time: answer["created_time"],
      question_title: answer["question_title"],
      voteup_count: answer["voteup_count"],
      comment_count: answer["comment_count"],
    };
    result.push(temp_answer);
  });

  await db.collection("answers_with_comments_select_features_flat_comments_each_comment_one_line").insertMany(result);
};

client.connect();
const db = client.db(dbName);
// const collection = db.collection(collectionName1);
flattenAnswersAndComments(db);
