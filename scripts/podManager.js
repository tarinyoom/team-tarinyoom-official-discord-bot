var request = require('request');
const secrets = require('./secretManager')

/**
 * Formats messages and sends them to the pinecone backend
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {[{id: string, embedding: [float]}]} messages stores strings and embeddings
 */
async function recordMessages(guildId, channelId, messages) {
    const cone = {
        "vectors": messages.map(msg => {
            return {
                "id": msg.id,
                "values": msg.embedding,
                "metadata": {
                    "channelId": channelId
                }
        }}),
        "namespace": guildId
    };

    await upsertVectors(cone);
};

async function upsertVectors(jsonObjects){
    return await callAPI("/vectors/upsert", jsonObjects);
}

async function search(values, namespace, numResults = 5) {
    var jsonObject = {
        "vector": values,
        "topK": numResults,
        "includeMetadata": true,
        "includeValues": true,
        "namespace": namespace
    };
    return await callAPI("/query", jsonObject);
}

async function deleteVectors(ids, namespace){
    var jsonObject = {
        "ids" : ids,
        "namespace" : namespace
    }
    return await callAPI("/vectors/delete", jsonObject);
}

async function callAPI(urlEndPoint, jsonObject) {
    return new Promise(function (resolve, reject) {
        request({
            url: secrets.getPineconeSecrets().url + urlEndPoint,
            method: "POST",
            headers: {
                'Api-Key': secrets.getPineconeSecrets().apiKey,
                'Content-Type': 'application/json'
            },
            json: true,   
            body: jsonObject
        }, function (error, response, body){
            if (!error && response.statusCode == 200) {
                console.log('Resolved ' + urlEndPoint);
                resolve(response.body.matches);
              } else {
                reject(error);
              }
        });
    });
}

module.exports = { upsertVectors, deleteVectors, search, recordMessages };
