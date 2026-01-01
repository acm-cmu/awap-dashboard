# API Calls Documentation

This document provides a comprehensive list of all API calls that occur in the AWAP Dashboard application and their destinations.

## Table of Contents
1. [Internal Next.js API Routes](#internal-nextjs-api-routes)
2. [Client-Side API Calls](#client-side-api-calls)
3. [External Service Calls](#external-service-calls)
4. [AWS Service Calls](#aws-service-calls)

---

## Internal Next.js API Routes

These are API endpoints defined within the Next.js application under `/src/pages/api/`.

### User API Routes

#### 1. `/api/user/s3-upload`
- **File**: `/src/pages/api/user/s3-upload.ts`
- **Method**: POST
- **Purpose**: Generate a signed URL for uploading files to AWS S3
- **Request Body**:
  ```typescript
  {
    name: string,      // File name
    type: string       // File MIME type
  }
  ```
- **External Calls**: AWS S3 `getSignedUrlPromise('putObject')`

#### 2. `/api/user/dynamo-upload`
- **File**: `/src/pages/api/user/dynamo-upload.ts`
- **Method**: POST
- **Purpose**: Store submission metadata in DynamoDB after file upload
- **Request Body**:
  ```typescript
  {
    uploadedName: string,
    user: string,
    fileName: string,
    timeStamp: string,
    submissionID: string
  }
  ```
- **External Calls**: 
  - DynamoDB `GetItemCommand` (AWS_PLAYER_TABLE_NAME)
  - DynamoDB `PutItemCommand` (AWS_SUBMISSIONS_TABLE_NAME)
  - DynamoDB `PutItemCommand` or `UpdateItemCommand` (AWS_PLAYER_TABLE_NAME)

#### 3. `/api/user/match-request`
- **File**: `/src/pages/api/user/match-request.ts`
- **Method**: POST
- **Purpose**: Request a scrimmage match between two teams
- **Request Body**:
  ```typescript
  {
    player: string,    // Player team name
    opp: string        // Opponent team name
  }
  ```
- **External Calls**:
  - DynamoDB `QueryCommand` (AWS_MATCH_TABLE_NAME with INDEX1)
  - DynamoDB `GetItemCommand` (AWS_PLAYER_TABLE_NAME) - twice for both teams
  - Axios POST to `http://{MATCHMAKING_SERVER_IP}/match/`

#### 4. `/api/user/match-history`
- **File**: `/src/pages/api/user/match-history.ts`
- **Method**: GET
- **Purpose**: Retrieve match history for the authenticated user
- **Authentication**: Required (NextAuth session)
- **External Calls**:
  - DynamoDB `QueryCommand` (AWS_MATCH_TABLE_NAME with INDEX1) - for TEAM_1
  - DynamoDB `QueryCommand` (AWS_MATCH_TABLE_NAME with INDEX2) - for TEAM_2

#### 5. `/api/user/bracket-change`
- **File**: `/src/pages/api/user/bracket-change.ts`
- **Method**: POST
- **Purpose**: Change a user's tournament bracket (beginner/advanced)
- **Request Body**:
  ```typescript
  {
    user: string,
    bracket: string
  }
  ```
- **External Calls**:
  - DynamoDB `GetItemCommand` (AWS_PLAYER_TABLE_NAME)
  - DynamoDB `PutItemCommand` or `UpdateItemCommand` (AWS_PLAYER_TABLE_NAME)

### Admin API Routes

#### 6. `/api/admin/match-history`
- **File**: `/src/pages/api/admin/match-history.ts`
- **Method**: GET
- **Purpose**: Retrieve global tournament match history (admin only)
- **Authentication**: Required (NextAuth session)
- **External Calls**:
  - DynamoDB `ScanCommand` (AWS_MATCH_TABLE_NAME) - filters by MATCH_TYPE = 'tournament'

#### 7. `/api/admin/start-tournament`
- **File**: `/src/pages/api/admin/start-tournament.ts`
- **Method**: POST
- **Purpose**: Start a tournament for a specific bracket
- **Request Body**:
  ```typescript
  {
    bracket: 'beginner' | 'advanced' | 'test'
  }
  ```
- **External Calls**:
  - DynamoDB `ScanCommand` (AWS_PLAYER_TABLE_NAME) - filtered by bracket
  - Axios POST to `http://{MATCHMAKING_SERVER_IP}/tournament/`

#### 8. `/api/admin/start-ranked-scrimmages`
- **File**: `/src/pages/api/admin/start-ranked-scrimmages.ts`
- **Method**: POST
- **Purpose**: Start ranked scrimmages for all players
- **External Calls**:
  - DynamoDB `ScanCommand` (AWS_PLAYER_TABLE_NAME) - all players with submissions
  - Axios POST to `http://{MATCHMAKING_SERVER_IP}/scrimmage/`

### Auth API Routes

#### 9. `/api/auth/[...nextauth]`
- **File**: `/src/pages/api/auth/[...nextauth].ts`
- **Purpose**: NextAuth authentication handler
- **External Calls**: DynamoDB operations for user authentication

#### 10. `/api/auth/register`
- **File**: `/src/pages/api/auth/register.ts`
- **Method**: POST
- **Purpose**: Register a new user account
- **Request Body**:
  ```typescript
  {
    username: string,
    password: string,
    bracket: string,
    email: string
  }
  ```
- **External Calls**:
  - DynamoDB `GetItemCommand` (AWS_USER_ACCOUNT_TABLE_NAME)
  - DynamoDB `PutItemCommand` (AWS_USER_ACCOUNT_TABLE_NAME)
  - DynamoDB `PutItemCommand` (AWS_PLAYER_TABLE_NAME)
  - DynamoDB `PutItemCommand` (AWS_RATINGS_TABLE_NAME)

#### 11. `/api/auth/logout`
- **File**: `/src/pages/api/auth/logout.ts`
- **Purpose**: Handle user logout

#### 12. `/api/auth/unauthorized`
- **File**: `/src/pages/api/auth/unauthorized.ts`
- **Purpose**: Handle unauthorized access

---

## Client-Side API Calls

These are API calls made from React components to internal or external endpoints.

### From User Submissions Page
**File**: `/src/pages/user/submissions.tsx`

1. **POST** `/api/user/s3-upload`
   - Line 127
   - Purpose: Get signed URL for S3 upload
   
2. **PUT** to S3 URL (external)
   - Line 133
   - Purpose: Upload file to S3 using signed URL
   - Headers: `Content-type`, `Access-Control-Allow-Origin`
   
3. **POST** `/api/user/dynamo-upload`
   - Line 140
   - Purpose: Save submission metadata to DynamoDB

### From User Scrimmages Page
**File**: `/src/pages/user/scrimmages.tsx`

1. **GET** `/api/user/match-history` (via SWR)
   - Line 214, 220
   - Purpose: Fetch user's match history with auto-refresh
   - Uses: `useSWR` hook for data fetching

2. **POST** `/api/user/match-request`
   - Line 107
   - Purpose: Request a match with another team

### From Admin Dashboard
**File**: `/src/pages/admin/index.tsx`

1. **GET** `/api/admin/match-history` (via SWR)
   - Line 67, 69-71
   - Purpose: Fetch global tournament match history
   - Uses: `useSWR` hook for data fetching

2. **POST** `/api/admin/start-tournament`
   - Line 81 (beginner bracket)
   - Line 107 (advanced bracket)
   - Line 133 (test bracket)
   - Purpose: Start a tournament for specific bracket

3. **POST** `/api/admin/start-ranked-scrimmages`
   - Line 159
   - Purpose: Start ranked scrimmages for all players

### From User Profile Page
**File**: `/src/pages/user/profile.tsx`

1. **POST** `/api/user/bracket-change`
   - Line 79
   - Purpose: Change user's tournament bracket

---

## External Service Calls

### Matchmaking Server API

The application communicates with an external matchmaking server for game orchestration.

**Base URL**: `http://{MATCHMAKING_SERVER_IP}`

#### 1. Match Endpoint
- **URL**: `http://{MATCHMAKING_SERVER_IP}/match/`
- **Method**: POST
- **Called From**: `/src/pages/api/user/match-request.ts` (line 135-138)
- **Purpose**: Create a scrimmage match between two teams
- **Request Payload**:
  ```typescript
  {
    game_engine_name: string,
    num_players: 2,
    user_submissions: [
      {
        username: string,
        s3_bucket_name: string,
        s3_object_name: string
      },
      {
        username: string,
        s3_bucket_name: string,
        s3_object_name: string
      }
    ]
  }
  ```

#### 2. Tournament Endpoint
- **URL**: `http://{MATCHMAKING_SERVER_IP}/tournament/`
- **Method**: POST
- **Called From**: `/src/pages/api/admin/start-tournament.ts` (line 147-150)
- **Purpose**: Start a tournament with multiple players
- **Request Payload**:
  ```typescript
  {
    game_engine_name: string,
    num_tournament_spots: string,
    user_submissions: Array<{
      username: string,
      s3_bucket_name: string,
      s3_object_name: string
    }>,
    bracket: 'beginner' | 'advanced' | 'test'
  }
  ```

#### 3. Scrimmage Endpoint
- **URL**: `http://{MATCHMAKING_SERVER_IP}/scrimmage/`
- **Method**: POST
- **Called From**: `/src/pages/api/admin/start-ranked-scrimmages.ts` (line 69-72)
- **Purpose**: Start ranked scrimmages for all players
- **Request Payload**:
  ```typescript
  {
    game_engine_name: string,
    user_submissions: Array<{
      username: string,
      s3_bucket_name: string,
      s3_object_name: string
    }>
  }
  ```

---

## AWS Service Calls

The application uses various AWS services via the AWS SDK.

### AWS S3 (Simple Storage Service)

**Configuration**: Uses `aws-sdk` v2 (Note: the application uses mixed SDK versions - aws-sdk v2 for S3, @aws-sdk/client-dynamodb v3 for DynamoDB)
**Region**: `process.env.AWS_REGION_LOCAL`
**Credentials**: `AWS_ACCESS_KEY_LOCAL`, `AWS_SECRET_KEY_LOCAL`

#### Operations:
1. **getSignedUrlPromise('putObject')**
   - **File**: `/src/pages/api/user/s3-upload.ts` (line 27)
   - **Purpose**: Generate pre-signed URL for file uploads
   - **Bucket**: `process.env.S3_UPLOAD_BUCKET`

### AWS DynamoDB

**Configuration**: Uses `@aws-sdk/client-dynamodb` v3
**Region**: `process.env.AWS_REGION_LOCAL`
**Credentials**: `AWS_ACCESS_KEY_LOCAL`, `AWS_SECRET_KEY_LOCAL`

#### Tables Used:

1. **AWS_PLAYER_TABLE_NAME**
   - Stores player/team information
   - Fields: `team_name`, `current_submission_id`, `bracket`
   - Operations: GetItem, PutItem, UpdateItem, Scan

2. **AWS_SUBMISSIONS_TABLE_NAME**
   - Stores submission history
   - Fields: `submission_id`, `team_name`, `bot_file_name`, `uploaded_file_name`, `current_submission_url`, `timeStamp`
   - Operations: PutItem, Scan

3. **AWS_MATCH_TABLE_NAME**
   - Stores match data
   - Fields: `MATCH_ID`, `TEAM_1`, `TEAM_2`, `MATCH_STATUS`, `MATCH_TYPE`, `OUTCOME`, `REPLAY_URL`, `LAST_UPDATED`
   - Indexes: INDEX1 (TEAM_1), INDEX2 (TEAM_2)
   - Operations: Query, Scan

4. **AWS_USER_ACCOUNT_TABLE_NAME**
   - Stores user authentication data
   - Fields: `username`, `password`, `role`, `image`, `email`
   - Operations: GetItem, PutItem

5. **AWS_RATINGS_TABLE_NAME**
   - Stores player ratings
   - Fields: `team_name`, `current_rating`
   - Operations: PutItem, Scan

#### DynamoDB Operations by File:

**Server-Side Rendering (getServerSideProps)**:
- `/src/pages/user/submissions.tsx` - ScanCommand (AWS_SUBMISSIONS_TABLE_NAME)
- `/src/pages/user/scrimmages.tsx` - ScanCommand (AWS_RATINGS_TABLE_NAME)
- `/src/pages/leaderboard.tsx` - ScanCommand (AWS_RATINGS_TABLE_NAME)
- `/src/pages/user/profile.tsx` - ScanCommand (AWS_PLAYER_TABLE_NAME)

**API Routes**:
- `/src/pages/api/user/dynamo-upload.ts` - GetItem, PutItem, UpdateItem
- `/src/pages/api/user/match-request.ts` - Query, GetItem
- `/src/pages/api/user/match-history.ts` - Query (2x with different indexes)
- `/src/pages/api/user/bracket-change.ts` - GetItem, PutItem, UpdateItem
- `/src/pages/api/admin/match-history.ts` - Scan
- `/src/pages/api/admin/start-tournament.ts` - Scan
- `/src/pages/api/admin/start-ranked-scrimmages.ts` - Scan
- `/src/pages/api/auth/register.ts` - GetItem, PutItem (3 tables)
- `/src/pages/api/auth/[...nextauth].ts` - Various operations for authentication

---

## Environment Variables Required

The following environment variables are used for API configurations:

### AWS Configuration
- `AWS_ACCESS_KEY_LOCAL` - AWS access key ID
- `AWS_SECRET_KEY_LOCAL` - AWS secret access key
- `AWS_REGION_LOCAL` - AWS region (e.g., us-east-1)

### S3 Configuration
- `S3_UPLOAD_BUCKET` - S3 bucket name for file uploads
- `S3_URL_TEMPLATE` - Template URL for accessing S3 objects

### DynamoDB Tables
- `AWS_PLAYER_TABLE_NAME` - Player/team table
- `AWS_SUBMISSIONS_TABLE_NAME` - Submissions table
- `AWS_MATCH_TABLE_NAME` - Match data table
- `AWS_MATCH_TABLE_INDEX1` - Index for TEAM_1
- `AWS_MATCH_TABLE_INDEX2` - Index for TEAM_2
- `AWS_USER_ACCOUNT_TABLE_NAME` - User accounts table
- `AWS_RATINGS_TABLE_NAME` - Player ratings table

### Matchmaking Server
- `MATCHMAKING_SERVER_IP` - IP/hostname of the matchmaking server
- `GAME_ENGINE_NAME` - Name of the game engine to use
- `NUM_TOURNAMENT_SPOTS` - Number of spots in tournaments

---

## API Call Flow Diagrams

### Submission Upload Flow
```
User Browser
    ↓ (1) POST /api/user/s3-upload
Next.js API
    ↓ (2) getSignedUrlPromise
AWS S3
    ↓ (3) Returns signed URL
Next.js API
    ↓ (4) Returns URL to browser
User Browser
    ↓ (5) PUT to signed URL
AWS S3 (file stored)
    ↓ (6) POST /api/user/dynamo-upload
Next.js API
    ↓ (7) PutItem/UpdateItem
AWS DynamoDB
```

### Match Request Flow
```
User Browser
    ↓ (1) POST /api/user/match-request
Next.js API
    ↓ (2) Query match history
AWS DynamoDB
    ↓ (3) Get player bot info
AWS DynamoDB
    ↓ (4) POST /match/
Matchmaking Server
    ↓ (5) Match created
Next.js API
    ↓ (6) Success response
User Browser
```

### Tournament Start Flow
```
Admin Browser
    ↓ (1) POST /api/admin/start-tournament
Next.js API
    ↓ (2) Scan for players in bracket
AWS DynamoDB
    ↓ (3) POST /tournament/
Matchmaking Server
    ↓ (4) Tournament started
Next.js API
    ↓ (5) Success response
Admin Browser
```

---

## Summary Statistics

- **Total Internal API Routes**: 12
- **Client-Side API Calls**: 8 unique calls (some repeated)
- **External Services**: 1 (Matchmaking Server with 3 endpoints)
- **AWS Services Used**: 2 (S3, DynamoDB)
- **DynamoDB Tables**: 5
- **DynamoDB Operation Types**: 5 (GetItem, PutItem, UpdateItem, Query, Scan)

---

*This documentation is based on the repository state at the time of generation.*
