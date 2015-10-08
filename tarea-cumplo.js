//List of the databases that make up this application.
//Each database has a list of datasets
Databases = new Mongo.Collection("databases");

//The list (database) of datasets each database has.
//Each of this datasets is composed of data elements
Datasets = new Mongo.Collection("datasets");

//The data associated with a dataset
Data = new Mongo.Collection("data");

//Client logic (currently in client/client.js)
if (Meteor.isClient) {
}

//Server logic (currently in server/server.js)
if (Meteor.isServer) {
}

