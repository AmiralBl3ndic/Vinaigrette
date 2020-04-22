# Vinaigrette

Express.JS server for hosting custom PopSauce-like games.

This server requires you to have an AWS account and that you have an access key to your 
account.

## Available REST API endpoints

### IMPORTANT

To avoid flood, the API only authorizes a certain number of requests on resource-consuming endpoints.

There are two limiters:
- `postLimiter`: The requests limit to all endpoints protected by this limiter (shared) is set to **60 requests by hour** (default)
- `randomLimiter`: The requests limit to all endpoints protected by this limiter (shared) is set to **3600 requests by hour** (default)

### `GET /`

Get a HTML testing page for feeding data to the database

### `POST /sauce/quote`

Add a new quote sauce to the database

#### Requests limiter

This endpoint is protected with the `postLimiter` requests limiter.

#### Request body

The request body must contain the following fields:

- `quote` *(string)*: The quote to store
- `answer` *(string)*: The awaited answer to the sauce

### `POST /sauce/image`

Add a new image sauce to the database

#### Requests limiter

This endpoint is protected with the `postLimiter` requests limiter.

#### Request body

The request body must contain the following fields:

- `image` *(file)*: The image to store (MIME type must be either "image/jpeg" or "image/png")
- `answer` *(string)*: The awaited answer to the sauce

#### Warning

This endpoint is only able to parse requests sent with `Content-Type: multipart/form-data`.

By default, this endpoint will only accept files up to 15 MB. This threshold is configurable with the 
`maximumImageSizeAllowed` variable of `server.config.js`.

### `GET /sauce/random`

Get a random sauce (image or quote) from the database

#### Requests limiter

This endpoint is protected with the `randomLimiter` requests limiter.

#### Response

The response will be a JSON object, its structure depends on whether you have retrieved a quote 
or an image.

If you are retrieving a quote, the structure will be as follow:

```json
{
    "type": "quote",
    "quote": "Content of the random quote sauce",
    "answer": "Answer to that random quote sauce"
}
```


If you are retrieving an image, the structure will be as follow:

```json
{
    "type": "image",
    "imageUrl": "https://secure-link-to-the-image/",
    "answer": "Answer to that random image sauce"
}
```

### `GET /sauce/random/quote`

Get a random quote sauce from the database

#### Requests limiter

This endpoint is protected with the `randomLimiter` requests limiter.

#### Response

This endpoint produces a JSON object with the structure as follow:

```json
{
    "type": "quote",
    "quote": "Content of the random quote sauce",
    "answer": "Answer to that random quote sauce"
}
```

### `GET /sauce/random/image`

Get a random image sauce from the database

#### Requests limiter

This endpoint is protected with the `randomLimiter` requests limiter.

#### Response

This endpoint produces a JSON object with the structure as follow:

```json
{
    "type": "image",
    "imageUrl": "https://secure-link-to-the-image/",
    "answer": "Answer to that random image sauce"
}
```


## Available sockets actions

The server uses [socket.io](https://socket.io/) for handling sockets and real-time data.

To use it client-side, you can retrieve the JS code exposed at `/socket.io/socket.io.js`.

The available custom actions that the server will understand are the following:

### `set_username`

Set your username for the session.

#### Parameters

You must provide a username in the `username` field of the parameter (object).

**IMPORTANT:** For many events, it is required that you set a username.

#### Responses

The server will respond with the following events :

- `username_set`: Means that your username has been set. This event carries the set username 
as a string parameter.
- `username_not_available`: Means that your username has not been set because it is not available. 
This event carries the unavailable username as a string parameter.

### `create_room`

Create a game room. Will produce an error if the room already exists.

You must have set a valid username before sending this event. Otherwise it will be denied.

#### Parameters

This action takes an object as a parameter, it must have the following properties set:

- `roomName` *(string)*: Name of the room to create

#### Responses

When performed, this action produces a response in the form of a socket event that you should 
listen to.

- `create_room_error` Indicates that the room could not be created, this response comes with an 
object parameter that will give more details about the failure through its `error` field
- `create_room_success` Indicates that the room has been created and that you have joined it, 
this response comes with an object parameter that will give you the name of the room with the 
`roomName` field and whether a game has started in that room with the `started` field.

### `join_room`

Join an existing game room. Will produce an error if the room does not exist.

You must have set a valid username before sending this event. Otherwise it will be denied.

#### Parameters

This action takes an object as a parameter, it must have the following properties set:

- `roomName` *(string)*: Name of the room to join

#### Responses

When performed, this action produces a response in the form of a socket event that you should 
listen to.

- `join_room_error` Indicates that the room could not be joined, this response comes with an 
object parameter that will give more details about the failure through its `error` field
- `join_room_success` Indicates that the room has been created and that you have joined it, 
this response comes with an object parameter that will give you the name of the room with the 
`roomName` field and whether a game has started in that room with the `started` field.

### `leave_room`

Leave an existing game room. Will produce an error if the room does not exist or if you have not 
joined it.

#### Parameters

This action takes an object as a parameter, it must have the following properties set:

- `roomName` *(string)*: Name of the room to leave

#### Responses

When performed, this action produces a response in the form of a socket event that you should 
listen to.

- `leave_room_error` Indicates that the room could not be left, this response comes with an 
object parameter that will give more details about the failure through its `error` field
- `leave_room_success` Indicates that the room has been left, this response comes with an 
object parameter that will give you the name of the room


### `start_game`

Start the game in the game room. For that, you must have joined a game room.

You must have set a valid username before sending this event. Otherwise it will be denied.

#### Parameters

This action takes an object as a parameter, it must have the following properties set:

- `roomName` *(string)*: Name of the room to start the game in

#### Responses

When performed, this action produces a response in the form of a socket event that you should 
listen to.

- `start_game_error` Indicates that the room could not be created, this response comes with an 
object parameter that will give more details about the failure through its `error` field
- `start_game_success` Indicates that the room has been created and that you have joined it, 
this response comes with an object parameter that will give you the name of the room

### `sauce_answer`

Submit an answer for the current sauce.

The server will only listen for this event in the timespan of a round. 

#### Parameters

This action takes a string as parameter, it must contain the submitted answer.

#### Responses

The server will respond with events:

- `wrong_answer`: If the answer is incorrect
- `good_answer`: If the answer is correct

### `chat`

Send a chat message in the game room you are playing.

#### Parameters

This action takes only a string as parameter, it must contain the content of the message.

### `report_sauce`

Report the sauce currently being displayed as being wrong or inacceptable.

#### Parameters

This action does not take any parameter.

#### Responses

The server will respond with the `report_received` event when it has received and processed the report.

This event does not carry any additional data.


## Handling server events

In addition to the socketing responses described for the actions above, the server will 
send socket events depending on other players activity or game status.

They are described here.

### `rooms_list_update`

The server sends this event whenever a room is added or deleted.

It contains the list of room names as an array in the `roomNames` field of its parameter.

### `no_sauces_available`

The server sends this event whenever there is no sauce available. 

It happens when a game is started but the database does not contain a single record.

### `game_start`

The server sends this event to all players in a room when a game is started in the room 
the players are in.

This event does not carry any data.

### `game_end`

The server sends this event when the game in your room ended before a player won.

This event does not carry any data.

### `new_round_sauce`

The server sends this event at each round start. Its parameter contains the sauce information as a json object:

- In case of a quote

```javascript
{
    "type": "quote",
    "quote": "Lorem ipsum dolor sit amet",  // Content of the quote
    "id": "zretsrvsfv342Adfgt"  // ID of the quote
}
```

- In case of an image

```javascript
{
    "type": "image",
    "imageUrl": "https://link-to-the-image.jpg",  // Link to the image
    "id": "zretsrvsfv342Adfgt"  // ID of the image
}
```

### `scoreboard_update`

The server sends this event at each time a player in your room updates its score (usually because 
he found the answer).

Its parameter contains the following:

```javascript
{
    scoreboard: [
        {
            "player": "johndoe",  // Username of the player to update
            "found": true,  // Boolean indicating if player found answer (should be true most of the time)
            "score": 42  // Score of the user
        }
    ]
}
```

### `round_end`

This event name's is self explanatory: the server sends it at each round end.

### `right_answer`

The server sends this event at each round end, it contains the right answer to the sauce.

**WARNING:** this event will soon be merged with the [`round_end`](#`round_end`) event.

### `timer_update`

This event is sent by the server to all the players in a room when the remaining time to 
guess the sauce has changed (every second, then).

It only contains a number representing the remaining time in seconds.

### `player_won`

The server sends this event when a player won the game.

Its parameter contaains the following:

```javascript
{
    "username": "johndoe",  // Username of winner 
    "score": 101  // Score of winner
}
```

### `chat`

The server sends this event to all users in a room when a user of this room sent a 
message in the chat.

Its data is formatted as follow:

```javascript
{
    "username": "johndoe",  // Username of the user who sent the message
    "message": "Hello, world!"  // Content of the message sent by the user
}
```


## Troubleshooting

Whenever an error occurs, you should aways be able to retrieve a JSON object describing the nature 
of the error or your problem.

A quick way to understand is to look at the `message` field of this JSON object, it should contain 
a human-readable description of the exact problem.


## Setup

1. Create an AWS account

This is pretty straightforward

2. Get an IAM access key to your AWS account

This can be done in the *IAM* section of your AWS Console.

Please keep the access key ID and secret because the server needs them to connect to a S3 
Bucket.

3. Create a S3 Bucket and setup the following rules

Once again, this is pretty straightforward, so do not forget to untick the *"Block Public 
Access"* box.

Because you only want the server to be able to directly write files into your bucket, please 
set the following strategy for your bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME-HERE/*"
        }
    ]
}
```

This strategy will allow any IP to HTTP GET files in your bucket, so be careful what you put 
into it.

4. Configure the environment variables

This server heavily relies on environment variables, so you should place the following 
variables into a `.env` file at the root of the server.

- `EXPRESS_LISTENING_PORT`: Port on which you want the server to listen for requests 
(default is `4242`)
- `AWS_REGION_CODE`: Region code in which to use AWS *(examples: eu-west-2, us-east-1, ...)*
- `AWS_S3_BUCKET_NAME`: AWS S3 Bucket name where to store the data retrieved by the server
- `AWS_ACCESS_KEY_ID`: ID of the access key that the server should use to access your S3 
Bucket
- `AWS_SECRET_ACCESS_KEY`: Secret of the access key to required to access the S3 Bucket
- `MONGO_INITDB_ROOT_USERNAME`: Username to use for accessing your MongoDB database (does not have to be root)
- `MONGO_INITDB_ROOT_PASSWORD`: Password of the user to use for accessing the MongoDB database
- *(Optional)* `CONTAINERIZED`: `(true|false)` Whether you are running your application in a container (LXC/Docker)

5. Ensure the database connection string is correct

This information can be found in the file `src/server.config.js` under the `mongoConnectionString` property.

By default, the connection string allows to work in a local environment with the a local instance of MongoDB 
(better for debugging) rather than setting up containers already.

Please ensure the database connection string matches the one you want to use :
**If you use a sub database in your MongoDB instance, you have to specify it here as the application does not handle such cases yet**
