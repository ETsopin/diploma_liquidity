#!bin/bash

docker exec -it liquidity_mongo_dev mongosh -u admin -p mongopass --authenticationDatabase admin
