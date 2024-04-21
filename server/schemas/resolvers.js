// Define the query and mutations to work with Mongoose Models
const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // Resolver for "me" query
    me: async (parent, args, context) => {
      
      if (context.user) {
        // Retrieve user data from the database based on the context
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password") // exclude __v and password fields
          .populate("book"); // populate book 
        return userData; // return userData
      }
      // Throw an auth error if the user is not logged in
      throw new AuthenticationError("Not logged in");
    },
    
  },

  Mutation: {
    // Resolver for login mutation
    login: async (parent, { email, password }) => {
      console.log(email, password);
      // Find user by email in the database, throw an auth error if no user is found with the given email
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }
      // Check if the password is correct for the user, throw an auth error if the password is incorrect
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      // generate a token for the authenticated user
      const token = signToken(user);
      // return the token and the user data
      return { token, user };
    },

    // Resolver for addUser mutation
    addUser: async (parent, { username, email, password }) => {
      // Create a new user in the database with given username, email and password
      const user = await User.create({ username, email, password });
      // Generate a token for the newly created user
      const token = signToken(user);
      // return the token and the user data
      return { token, user };
    },

    // Resolver for saveBook mutation
    saveBook: async (parent, { bookInput }, context) => {
        // Checks if the user is authenticated, if not , throw an error
        if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }
      
      try {
        // Update the user document in the database to save the book 
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookInput } }, // Add the book to the users savedBooks array 
          { new: true, runValidators: true } // Return the updated user document with the new book added
        ).populate("savedBooks"); // Populate the savedBooks field of the updated user document

        // Return the updated user document
        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error("Unable to save book.");
      }
    },

    // Resolver for removeBook mutation
    removeBook: async (parent, { bookId }, context) => {
      // Check if the user is authenticated, if not throw an auth error  
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        // Update the user document in the database to remove the book with the specific bookId
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } }, // Remove the book with the specified bookId from the savedBooks array
          { new: true } // Return the updated user document
        ).populate("savedBooks"); // Populate the savedBooks field of the updated user document

        // If the updated user document is not found, throw an error
        if (!updatedUser) {
          throw new Error("Couldn't find user with this id!");
        }

        // Return the updated user document
        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error("Unable to remove book.");
      }
    },
  },
};
module.exports = resolvers;
