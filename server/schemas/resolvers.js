// Define the query and mutations to work with Mongoose Models
const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("book");
        return userData;
      }
      throw new AuthenticationError("Not logged in");
    },
    users: async () => {
      return User.find().select("-__v -password").populate("book");
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select("-__v -password")
        .populate("book");
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken(user);
      return { token, user };
    },

    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { bookInput }, context) => {
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookInput } }, // checks for duplicates before updating the array
          { new: true, runValidators: true }
        ).populate("savedBooks");

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error("Unable to save book.");
      }
    },

    removeBook: async (parent, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate("savedBooks");

        if (!updatedUser) {
          throw new Error("Couldn't find user with this id!");
        }

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error("Unable to remove book.");
      }
    },
  },
};
module.exports = resolvers;
