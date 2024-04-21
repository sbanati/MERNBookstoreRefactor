import "./App.css";
// Important for API Consumption: To enable interaction with our GraphQL API on the front end, we utilize these tools to develop the client-side behavior
import { ApolloClient, InMemoryCache, ApolloProvider, } from "@apollo/client";
import { Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";

// Important for API Consumption: Create an instance of the ApolloClient class and specify the endpoint of the GraphQL API
const client = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <>
        <Navbar />
        <Outlet />
      </>
    </ApolloProvider>
  );
}

export default App;
