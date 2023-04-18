export async function run(client) {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Make appropriate DB calls
    // // Query for a party that has the name 'Qora & The Aliens'
    // const database = client.db('dnd');
    // const parties = database.collection('parties');
    // const query = { name: 'Qora & The Aliens' };
    // const party = await parties.findOne(query);
    // console.log(party);

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

// Add functions that make DB calls here
export async function findOnePartyByName(client, nameOfParty) {
  const result = await client
    .db('dnd')
    .collection("parties")
    .findOne({ name: nameOfParty });

  if (result) {
      console.log(`Found a party with the name '${nameOfParty}':`);
      // console.log(result);
  } else {
      console.log(`No parties were found with the name '${nameOfParty}'`);
  }

  return result;
}

export async function updateOnePartyByName(client, nameOfParty, updatedPartyObj) {
  const result = await client
    .db("dnd")
    .collection("parties")
    .updateOne(
      { name: nameOfParty },
      { $set: updatedPartyObj },
    );

  console.log(`${result.matchedCount} document(s) matched the query criteria.`);
  console.log(`${result.modifiedCount} document(s) was/were updated.`);
}