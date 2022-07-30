const { buildSchema } = require('graphql');

const schema = buildSchema(`

  type Post {
    _id:ID!,
    title:String!
    content:String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt:String!
  }
  type User {
    _id :ID!
    name:String!
    email: String!
    password:String
    status:String!
    posts:[Post!]!
  }
  input UserInputData {
    email:String!
    name:String!
    password:String!
  }


  input PostInputData {
    title: String!
    content:String!
    imageUrl :String!
  }
  type AuthData{
    token: String!
    userId: String!
  }

  type PostsData {
    posts:[Post!]!
    totalPosts: Int!
  }
  type successMessage {
    message: String
    sucess:Boolean
  }


  type RootMutation {
    createUser(userInput : UserInputData) : User!
    
    createPost(postInput: PostInputData):Post!

    deletePost(postId: String! ):successMessage

    updatePost(postId : String! , postInput : PostInputData):Post!

    updateUserStatus(status:String!): User!
  }

  type RootQuery {
    login(email: String!,password : String!): AuthData!
    getPosts(page: Int): PostsData!
    getPostById(postId: ID!):Post!
    user:User!
  }



  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);



module.exports = schema;