/*
 * @Author: jiaminghui
 * @Date: 2024-03-03 20:24:04
 * @LastEditTime: 2024-03-04 11:05:14
 * @LastEditors: jiaminghui
 * @FilePath: \zhihu_data_process\src\aggregateOp.ts
 * @Description: 
 */
import { MongoClient } from "mongodb";

// 设置mongodb相关的配置信息
const username = 'root'; // 用户名
const password = '123456'; // 密码
const url = `mongodb://${username}:${password}@localhost:27017`;

// 创建mongodb客户端对象
const client = new MongoClient(url);
// 设置数据库的名称和集合名称，插入过程中如果不存在会自动创建
const dbName = "test";
const collectionName1 = "answers";
const collectionName2 = "comments";


const flattenComments = (answer, comment, depth) => {
  const text = comment.content.replace(/<[^>]*>?/g, "");
  const flatComment = {
    "comment_id": comment.id,
    "comment_type": comment.type,
    "comment_author_name": comment.author.name,
    "comment_content": text,
    "comment_created_time": comment["created_time"],
    "comment_like_count": comment["like_count"],
    "comment_voteup_count": comment["child_comment_count"],
    // The rest of the fields you need...
  };

  let result = [flatComment];
  
  if(comment.child_comments) {
    comment.child_comments.forEach(childComment => {
      result = result.concat(flattenComments(answer, childComment, depth + 1));
    });
  }
  
  return result;
};

const flattenAnswersAndComments = async (db) => {
  const answers = await db.collection('answers_with_comments_select_features').find({}).toArray();

  

  answers.forEach(answer => {
    let result = [];

    if(answer.comments) {
      answer.comments.forEach(comment => {
        result = result.concat(flattenComments(answer, comment, 1));
      });
    }
    answer.comments = result;
    let text = answer.content;
    if (text) {
      // text = text.replace(/[^\u4e00-\u9fa5。,，！!？?、：:；;\d]/g, "");
      text = text.replace(/<[^>]*>?/g, "");
      console.log(text);
    }
      
    answer.content = text;
  });

  await db.collection('answers_with_comments_select_features_flat_comments').insertMany(answers);
};

client.connect();
const db = client.db(dbName);
// const collection = db.collection(collectionName1);
flattenAnswersAndComments(db);