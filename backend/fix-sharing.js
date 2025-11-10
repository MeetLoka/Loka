import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://oronku_db_user:xoWM8Q1YYGnpLAYg@meetloca.fuhafon.mongodb.net/meetloca?retryWrites=true&w=majority&appName=Meetloca'

async function fixSharing() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✓ Connected to MongoDB')
    
    const db = client.db('meetloca')
    const tripsCollection = db.collection('trips')
    const usersCollection = db.collection('users')
    
    // Get all users
    const users = await usersCollection.find({}).toArray()
    console.log('\n=== Users ===')
    users.forEach(u => console.log(`  ${u.email}: id="${u.id}", _id="${u._id}"`))
    
    // Get all trips with sharedWith
    const trips = await tripsCollection.find({ sharedWith: { $exists: true, $ne: [] } }).toArray()
    console.log(`\n=== Found ${trips.length} trips with shared users ===`)
    
    for (const trip of trips) {
      console.log(`\nTrip: ${trip.name} (${trip.id})`)
      console.log('Owner userId:', trip.userId)
      console.log('Current sharedWith:', JSON.stringify(trip.sharedWith, null, 2))
      
      const updatedSharedWith = []
      
      for (const share of trip.sharedWith) {
        // Find user by email
        const user = await usersCollection.findOne({ email: share.email })
        
        if (user) {
          console.log(`  ✓ Found user ${share.email}, using id: ${user.id}`)
          updatedSharedWith.push({
            userId: user.id,  // Use custom id field
            email: share.email,
            name: share.name || user.name,
            sharedAt: share.sharedAt || new Date().toISOString()
          })
        } else {
          console.log(`  ✗ User ${share.email} not found`)
          updatedSharedWith.push(share)
        }
      }
      
      // Update the trip
      const result = await tripsCollection.updateOne(
        { id: trip.id },
        { $set: { sharedWith: updatedSharedWith, updatedAt: new Date().toISOString() } }
      )
      
      console.log(`  Updated: ${result.modifiedCount} document(s)`)
      console.log('  New sharedWith:', JSON.stringify(updatedSharedWith, null, 2))
    }
    
    console.log('\n✓ All trips updated!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

fixSharing()
