//Server variables
//These are obtained from the settings file
var apiKey;
var databaseCode;
var rateLimit10Minutes;
var rateLimitDay;
//Liks to get the data from
var databaseAPIUrl;
var datasetMetadataAPIUrl;
var datasetDataAPIUrl;


Meteor.startup(function () {
    //When the server starts, we load up the configuration from the file server/settings.json
    Meteor.call("loadServerSettings");
    //Now we check if there's a Database in our server with that name
    if(Databases.findOne({database_code: databaseCode}) == undefined){
      console.log("Downloading database "+databaseCode);
      Meteor.call("downloadDatabaseInformation", databaseCode);
    }
    //After checking the database, time to check the dataset
    //We start by checking if the number stored matches the one we got from the server
    //Note that we're adding a -1 here because the database we're using has an error.
    if(Datasets.find({database_code: databaseCode}).count()-1 != Databases.findOne({database_code: databaseCode}).datasets_count){
       //We need to download and process the CSV
       //To do this we simply call the addDatasets method
       Meteor.call("addDatasets", databaseCode);
    }
    else{
      console.log("Database's dataset list downloaded already");
    }
});

//Functions
    Meteor.methods({
        getDatasetInformation: function(dataset,databaseCode, datasetCode){
        //First check if there's such dataset  (and that the information hasn't been downloaded before)
        //var dataset = Meteor.call("getDataset", databaseCode, datasetCode);
        if(dataset != undefined){

          if(dataset.description == undefined){
            console.log("We need to download the dataset data!"+databaseCode+" "+datasetCode);
            //If we entered, this means there's no description for this dataset, so we need to download it.
            //Connect to the API using the given values
            var datasetInfo = Meteor.call("httpRequest", Meteor.call("parseAPIURL", Meteor.settings.datasetMetadataAPIUrl, databaseCode, datasetCode));
            //Check if the API returned information
            if(datasetInfo){
                //Add it to the dataset entry
              var datasetData = datasetInfo.data.dataset;
              //Update it using the data we just downloaded
              Datasets.update(dataset._id, { $set: datasetData});
              
              
            }
            else{
              //Error connecting to the API
              return null;
            }
          }
          else{
            console.log("Dataset "+datasetCode+"'s information has already been downloaded.");
          }
          //Now we check if we also need to download the data
          //We do this by checking if the data for this dataset is 0
          if( Data.find( {datasetId: dataset._id} ).count() == 0 ){
              console.log("-Downloading data for dataset "+datasetCode+" -");
              Meteor.call("addDatasetData", databaseCode, datasetCode);
              console.log("-Downloaded data for dataset "+datasetCode+" -");
          }
          else{
              //Dataset already has the data
              console.log("-Dataset's data has already been downloaded-");
          }
        }
        else{
          //There's no dataset with that code in that database, return null
          console.log("There's no dataset with the code "+datasetCode);
          return null;
        }
      }
    });



//Methods
Meteor.methods({
  //Startup methods
  /**
   * Loads the configuration settings from the file server/settings.json
   */
  loadServerSettings: function(){
    console.log("- Loading server's settings -");
    //- The Quandl API key
    apiKey = Meteor.settings.quandlAPIKey;
    console.log("\t-API key loaded.");
    //- The name of the database the application will be using
    databaseCode = Meteor.settings.databaseCode;
    console.log("\t-Database code loaded.");
    //-The rate limit per 10 minutes
    rateLimit10Minutes = Meteor.settings.rateLimit10Minutes;
    console.log("\t-Rate per 10 minutes is : "+rateLimit10Minutes);
    //-The daily rate limit
    rateLimitDay = Meteor.settings.rateLimitDay;
    console.log("\t-Daily rate limit is : "+rateLimitDay);
    //Now get the links for the API
    //The link used to get the database information
    databaseAPIUrl = Meteor.settings.databaseAPIUrl;
    //The link used to get a dataset's metadata
    datasetMetadataAPIUrl = Meteor.settings.datasetMetadataAPIUrl;
    //The link used to get the dataset's data
    datasetDataAPIUrl = Meteor.settings.datasetDataAPIUrl;
    //
    console.log("\t-Links loaded.");
    //Everything was loaded correctly
    console.log("- Server's settings loaded correctly - ");

  },
  //Quandl API call methods

  /**
   * Makes an http request to the given URL and returns the result.
   * @param  {String} url The URL to send the http request to.
   * @return {Object}     The response to the request. It can either be a JSON or an error.
   */
  httpRequest: function(url){
    //We wrap this in a try/catch block to catch error 400 and when the Quandl API may be down
    try{
      return Meteor.http.get(url);
    }
    catch(error){
      //We log the error into the console and return null
      console.log("Error: "+error);
      return null;
    }
  },
  downloadDatabaseInformation: function(databaseCode){
      
    var database = Meteor.call("getDatabase", databaseCode);
    if(database == undefined){

      //There are none, we need to add it to our local database and then read the CSV with the datasets for it
      //First we get the data from the Quandl API
      var databaseAPIResponse = Meteor.call("getDatabaseInformationJson", databaseCode);
      //If we get a null, there was an error connecting to the api: either this database code does not exists or the API is down
      if(databaseAPIResponse){
        //The connection was successful and we continue as usual
        //Extract the data from the reponse
        var databaseData = databaseAPIResponse.data.database;
        //And now we can get the values from this data
        //With this, we add it to the database
        Databases.insert({
          name: databaseData.name,
          database_code: databaseCode,
          description: databaseData.description,
          image: databaseData.image,
          datasets_count: databaseData.datasets_count,
          premium: databaseData.premium,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        //Log it as well
        console.log("Database " + databaseCode + " added.");
        console.log("Database data: "+databaseData.name);
      }
      else{
        console.log("Error:  "+ databaseAPIResponse);
      }
    }
    else{ //There's already a database with that name in our 
      console.log("Database already added.");
    }


  },
  /**
   * Gets the information about a database from the Quandl API, given a specific database code.
   * @param  {String} databaseCode The databases code we're asking information about.
   * @return {JSON}                The object that contains the result of the query.
   */
  getDatabaseInformationJson: function(databaseCode){
    return Meteor.call("httpRequest", Meteor.call("parseAPIURL", databaseAPIUrl, databaseCode, ""));
  },
  /**
   * Returns the .csv file given in settings.json.
   * @param  {String} databaseCode The database we're getting the dataset's code.
   * @return {String}              The name of the csv file.
   */
  downloadDatasetsCSV: function(databaseCode){
      return Meteor.settings.databaseCSVFile;
  },
  //
  /**
   * Method that downloads and processes the dataset file, adding them to the database.
   * @param  {String} databaseCode The database we're getting the dataset's code from.
   * @return {Number}              The number of datasets we added.
   */
  addDatasets: function(databaseCode){
      //First we download and extract the csv, using the method for it
       var csvFile = Meteor.call("downloadDatasetsCSV", databaseCode);

      //Then we read it, line by line, making sure we don't have any repeated entries
      //Note that this works asyn
       Assets.getText(csvFile, function(err, csvText) {
        //Split the csv in the line breaks
        var allTextLines = csvText.split(/\r\n|\n/);
        //Now create the variables we'll be using for each dataset.
        //Where we will be storing the parts of each line that makes up a dataset.
        var lineSubElements = [];
        //The name of the dataset we're currently working with.
        var datasetName;
        //The counters of datasets read and added.
        var totalRead = 0;
        var totalAdded = 0;
        //Read every line of the file
        //Used for testing the load of data into the database
        //var limiter = 30;
        //for(var i=10; i<limiter; i++){
        for(var i=0; i<allTextLines.length; i++){
          //We use the greedy operator to split it up to the first , (since the name of the datasets usually have commas too).
          lineSubElements = allTextLines[i].split(/,(.+)?/);
          //Now we have in [0] = DATABASE NAME/DATASET NAME, let's split that by the /
          datasetCode = lineSubElements[0].split('/')[1];
          //Check that it's not repeated before adding it
          if(Datasets.find({$and: [{ database_code: databaseCode },{ dataset_code: datasetCode }]}).count() == 0){
            //Not added yet, add it.
            Datasets.insert({
              database_code: databaseCode,
              name: lineSubElements[1],
              dataset_code: datasetCode,
              createdAt: new Date(),
              lastUpdate: new Date()
            });
            totalAdded++;
          }

          totalRead++;
        }
        //Log our work.
        console.log("Completed: Read " + totalRead + " datasets. Total added: "+totalAdded);
        //Finally, we return the total of entries added
        return totalAdded;
      });
  },
  /**
   * Connects to the Quandl API and downloads the data for a given dataset. It then adds that to the local database.
   * @param  {String} databaseCode The database that contains the dataset's code.
   * @param  {String} datasetCode  The dataset's code.
   */
  addDatasetData: function(databaseCode, datasetCode){

      //Check that both database and dataset exist
      var datasetId = Meteor.call("getDataset", databaseCode, datasetCode)._id;
      //Connect to the api using the API key
      var datasetData = Meteor.call("httpRequest", Meteor.call("parseAPIURL", datasetDataAPIUrl, databaseCode, datasetCode)+ "");
      //It's a json, so we can iterate through it normally
      //But first check if there were no errors
      if(datasetData){
        //Get the data
        var dataValues = datasetData.data.dataset_data.data;
        var entriesAdded = 0;
        var dateParts;
        for(var i=0; i<dataValues.length;i++){
          //Check that it's not repeated
          if(Data.findOne( {$and: [{ datasetId: datasetId },{ values: dataValues[i] }]} ) == undefined){
            //Separate the date parts
            dateParts = dataValues[i][0].split("-");
            //Now add it
            Data.insert({
              datasetId: datasetId,
              date: new Date(dateParts[0], dateParts[1], dateParts[2]),
              values: dataValues[i]
            });
            entriesAdded++;
          }
          else{
            //Entry already exists
          }
            
        }
        console.log("Entries added: "+entriesAdded);
      }
  },
 /**
  * This method places the correct data in a given link, replacing it. 
  * @param  {String} url          The url to put the information itn.
  * @param  {String} databaseCode The database's code.
  * @param  {String} datasetCode  The dataset's code. Can be empty.
  * @return {String}              The url with the correct data.
  */
  parseAPIURL: function(url, databaseCode, datasetCode){
    //First we replace the database code
    var result = url.replace(":databaseCode",databaseCode.toUpperCase());
    //Then the dataset code
    result = result.replace(":datasetCode",datasetCode.toUpperCase());
    //Now we return it
    return result;
  },
  /**
   * Returns a specific dataset, identified by the database 
   * @param  {[type]} databaseCode [description]
   * @param  {[type]} datasetCode  [description]
   * @return {[type]}              [description]
   */
  getDataset: function(databaseCode, datasetCode){
    return Datasets.findOne( {$and: [{ database_code: databaseCode },{ dataset_code: datasetCode }]} );
  },
  /**
   * Gets the database that has the given database code. 
   * @param  {String} databaseCode The unique identifier
   * @return {Database}            The database we're looking for.
   */
  getDatabase: function(databaseCode){
     return Databases.findOne({database_code: databaseCode});
  },
  /**
   * Returns the database code loaded from the configuration.
   * @return {String} The database code.
   */
  getDatabaseCode: function(){
    return databaseCode;
  },
  /**
   * Returns the dataset sub-segment to be displayed in the client. 
   * @param  {Number} offset This defines the "page" we're currently on.
   * @return {Array}         The array of datasets to be displayed.
   */
  getDatasetList: function(offset){
    //Find the group of datasets we will use.
    var datasets = Datasets.find({database_code: databaseCode}, {sort: {dataset_code: 1}, skip: 10*offset ,limit: 10});
    //Put them in an array
    var datasetsAsArray = [];
    datasets.forEach(function (row) {
            datasetsAsArray.push(row.dataset_code);
        }); 
    return datasetsAsArray;
  },
  /**
   * Returns the data to be displayed, based on the current database, dataset and the "page", which is calculated through the offset.
   * @param  {Stting} databaseCode Code of the currently working database.
   * @param  {String} datasetCode  Code of the currently working dataset.
   * @param  {Number} offset       The number that will be multiplied by the limiter when displaying the data.
   * @return {Array}               The data to be displayed as an array.
   */
  getDisplayData: function(databaseCode, datasetCode, offset){
    //We get the appropiate dataset id from the databasecode and the datasetcode
    var datasetId = Meteor.call("getDataset", databaseCode, datasetCode)._id;
    //Then we get the data to be converted, limited by the offset and the display limit
    var data = Data.find({datasetId: datasetId}, {skip: 10*offset ,limit: 10})
    //And finally we transform it into an array so that the template can work with it
    var dataAsArray = [];
    data.forEach(function (row) {
            dataAsArray.push(row);
    }); 
    return dataAsArray;
  },
  /**
   * Returns the maximun number of pages that can be reched in the pagination of the dataset list
   * @return {Number} Max number of pages we can reach with the pagination.
   */
  getDatassetListPaginationUpperLimit: function(){
      //First get the numnber of datasets.
      var numberOfDatasets = Datasets.find({}).count();
      //Then return it (rounded up) after dividing it by the limiter.
      //The one we're substracting is because the offset starts at 0.
      return Math.ceil(numberOfDatasets/10)-1;
  },
  /**
   * Returns the maximum number of pages that can be reached in the pagination of the display data.
   * @param  {String} databaseCode The databases's code.
   * @param  {String} datasetCode  The dataset's code.
   * @return {Number}              The maximum number of pages for the display data.
   */
  getDisplayDataPaginationUpperLimit: function(databaseCode, datasetCode){
      //First we get the dataset id from the databaseCode and the datasetCode
      var datasetId = Meteor.call("getDataset", databaseCode, datasetCode)._id;
      //Then we get all the data entries that have that id as datasetid, and we count it
      var numberOfDataEntries = Data.find({datasetId: datasetId}).count();
      //Then we return the result of rounding it up after diving it by the limiter
      //We substract one because the offset starts at 0.
      return Math.ceil(numberOfDataEntries/10)-1;
  }

});
