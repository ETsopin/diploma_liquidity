import { MongoClient } from 'mongodb';

const uri = 'mongodb://app_user:app_password@mongo:27017/liquidity'; // change in prod
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
	if (!(global as any)._mongoClientPromise) {
		client = new MongoClient(uri, options);
		(global as any)._mongoClientPromise = client.connect();
	}
	clientPromise = (global as any)._mongoClientPromise;
} else {
	client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

export default clientPromise;
