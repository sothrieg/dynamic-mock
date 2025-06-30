# JSON Schema API Generator

A powerful Next.js application that automatically generates **full CRUD REST API endpoints** from your JSON data and JSON Schema files. Upload your files, validate them with enhanced format checking, and instantly get production-ready API endpoints with interactive Swagger documentation, **real-time analytics monitoring**, and **Postman collection export**.

![JSON Schema API Generator](https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## 👨‍💻 Developer

**Thomas Rieger**  
📧 t.rieger@quickline.ch

---

## ✨ Features

### 🚀 **Complete CRUD API Generation**
- Upload JSON data and JSON Schema files
- Automatically generates **full CRUD REST API endpoints**
- **GET** - Retrieve data (collections and individual items)
- **POST** - Create new items with automatic ID generation
- **PUT** - Replace entire items with validation
- **PATCH** - Update specific fields only
- **DELETE** - Remove items permanently
- No coding required - just upload and go!

### 📊 **Real-time API Analytics & Monitoring**
- **Live Performance Dashboard** with real-time metrics
- **Request Tracking** - Monitor all API calls in real-time
- **Performance Analytics** - Response times, throughput, and load metrics
- **Error Monitoring** - Track and analyze API errors and failures
- **Usage Statistics** - Detailed insights into API usage patterns
- **Interactive Charts** - Visual representation of API performance
- **Live Request Feed** - Real-time stream of API requests
- **Historical Data** - 7-day retention with hourly and daily breakdowns
- **Server-Sent Events** - Real-time updates without page refresh
- **Export Capabilities** - Download analytics data and reports

#### Analytics Features Include:
- 🔴 **Real-time Metrics**: Current load, requests per minute, active connections
- 📈 **Performance Charts**: Response times, request volumes, error rates
- 🎯 **Endpoint Analytics**: Most popular endpoints, average response times
- 🚨 **Error Tracking**: HTTP status codes, error types, failure patterns
- 📅 **Time-based Analysis**: Hourly trends, daily patterns, peak usage times
- 🔄 **Live Updates**: Automatic refresh every 5 seconds via SSE
- 📊 **Visual Dashboard**: Interactive charts with Recharts integration
- 🎨 **Beautiful UI**: Color-coded metrics with intuitive design

### 📮 **Export to Postman Collection**
- **One-Click Export** - Download complete Postman collection
- **Organized Structure** - Folders for each resource with all CRUD operations
- **Realistic Examples** - Auto-generated sample data for testing
- **Complete Documentation** - Detailed descriptions for each endpoint
- **Environment Variables** - Base URL variable for easy environment switching
- **Team Collaboration** - Share collections with your development team
- **Instant Testing** - Import and start testing your API immediately

#### Postman Collection Features:
- 📋 **Collection Endpoints**: GET all items with proper examples
- ➕ **Create Operations**: POST with realistic sample data
- 🔍 **Item Retrieval**: GET specific items by ID
- 🔄 **Full Updates**: PUT operations with complete examples
- ✏️ **Partial Updates**: PATCH operations with selective field updates
- 🗑️ **Delete Operations**: DELETE endpoints with proper documentation
- 📚 **Utility Endpoints**: API documentation and analytics access
- 🎯 **Smart Variables**: Parameterized IDs and base URLs
- 📝 **Rich Documentation**: Comprehensive descriptions and usage examples

### 🔍 **Enhanced Validation & Data Management**
- Comprehensive JSON Schema validation using AJV
- Advanced format validation support:
  - Email addresses
  - URIs and URLs
  - Dates (YYYY-MM-DD)
  - Date-time (ISO 8601)
  - Phone numbers
  - IPv4/IPv6 addresses
  - Hostnames
  - Custom formats (slugs, etc.)
- Automatic ID generation for new items
- Timestamp management (createdAt, updatedAt)
- Data integrity preservation
- Detailed error messages with field-specific feedback

### 📚 **Interactive Documentation**
- Auto-generated Swagger/OpenAPI 3.0 documentation
- Interactive API testing interface for **all HTTP methods**
- Try all CRUD operations directly from the documentation
- Automatic schema generation from your data
- Separate input schemas (without auto-generated fields)
- Professional API documentation ready for production
- Code examples in multiple languages (cURL, JavaScript, Python, PHP)
- Copy-to-clipboard functionality for all examples

### 💾 **Persistent Data Storage**
- File-based data storage for reliability
- Data persists between server restarts
- All CRUD operations update persistent storage
- Automatic data expiration (24 hours) for security
- Graceful error handling and recovery
- Session persistence across browser refreshes

### 🎨 **Beautiful UI/UX**
- Modern, responsive design with Tailwind CSS
- Color-coded HTTP method badges with icons
- Drag-and-drop file upload interface
- Real-time validation feedback
- Copy-to-clipboard functionality for API endpoints
- Gradient backgrounds and smooth animations
- Mobile-friendly responsive design
- Dark mode support for analytics dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd json-schema-api-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Step 1: Prepare Your Files

You need two files:
- **JSON Data File**: Contains your actual data
- **JSON Schema File**: Defines the structure and validation rules

#### Download Sample Files
The application provides sample files to get you started:
- Click "Download Sample Schema" for a complete schema example
- Click "Download Sample JSON Data" for matching data

### Step 2: Upload and Validate

1. **Upload JSON Data**: Drag and drop or click to select your JSON data file
2. **Upload JSON Schema**: Drag and drop or click to select your schema file
3. **Click "Validate & Generate APIs"**: The system will validate your data and create API endpoints

### Step 3: Use Your CRUD APIs

After successful validation, you'll see:
- ✅ Validation success message
- 📊 **Real-time Analytics Dashboard** link
- 📚 Link to interactive Swagger documentation
- 📮 **Export to Postman** functionality
- 📋 List of all generated CRUD API endpoints

#### Generated Endpoints

For each array in your JSON data, you get complete CRUD operations:

**Collection Endpoints:**
```bash
GET    /api/{resource}      # Get all items
POST   /api/{resource}      # Create new item
```

**Individual Item Endpoints:**
```bash
GET    /api/{resource}/{id} # Get specific item
PUT    /api/{resource}/{id} # Replace entire item
PATCH  /api/{resource}/{id} # Partial update
DELETE /api/{resource}/{id} # Delete item
```

### Step 4: Export to Postman

Click "Download Collection" in the Export to Postman section to get:

#### 📦 **Complete Postman Collection**
- **Resource Folders**: Organized by API resource (users, products, etc.)
- **All CRUD Operations**: Every enabled endpoint with examples
- **Smart Examples**: Realistic sample data for testing
- **Environment Variables**: `{{baseUrl}}` for easy environment switching
- **Rich Documentation**: Detailed descriptions for each request

#### 🎯 **What's Included**
```
📁 Users API
  📋 Get All users
  ➕ Create New user
  🔍 Get user by ID
  🔄 Replace user (Full Update)
  ✏️ Update user (Partial Update)
  🗑️ Delete user

📁 Products API
  📋 Get All products
  ➕ Create New product
  🔍 Get product by ID
  🔄 Replace product (Full Update)
  ✏️ Update product (Partial Update)
  🗑️ Delete product

📁 📚 API Documentation & Utilities
  📄 Get API Documentation (Swagger)
  📊 Get API Analytics Metrics
  📝 Get Recent API Requests
```

#### 🚀 **How to Use the Collection**
1. **Download**: Click "Download Collection" button
2. **Import to Postman**:
   - Open Postman
   - Click "Import"
   - Select the downloaded `.postman_collection.json` file
3. **Set Environment**: Update `{{baseUrl}}` variable if needed
4. **Start Testing**: All endpoints ready with examples!

### Step 5: Monitor with Real-time Analytics

Click "View Analytics" to access the comprehensive monitoring dashboard:

#### 🔴 **Real-time Metrics**
- **Current Load**: Requests per second
- **Active Connections**: Live connection count
- **Last Minute Stats**: Recent requests and errors
- **Average Response Time**: Performance metrics

#### 📊 **Performance Dashboard**
- **Request Volume Charts**: Hourly and daily trends
- **Response Time Analysis**: Performance over time
- **Error Rate Monitoring**: Success vs failure rates
- **HTTP Method Distribution**: Usage patterns by method

#### 🎯 **Endpoint Analytics**
- **Top Endpoints**: Most frequently accessed APIs
- **Performance by Endpoint**: Response times per endpoint
- **Usage Patterns**: Request distribution across resources

#### 🚨 **Error Monitoring**
- **Status Code Distribution**: HTTP response codes breakdown
- **Error Types**: Categorized error analysis
- **Failure Patterns**: Identify problematic endpoints

#### 📅 **Historical Analysis**
- **7-Day Data Retention**: Complete request history
- **Hourly Trends**: 24-hour performance patterns
- **Daily Summaries**: Week-over-week comparisons
- **Peak Usage Analysis**: Identify high-traffic periods

### Step 6: Explore Documentation

Click "View Documentation" to access the enhanced Swagger UI:
- **Interactive Testing**: Try all CRUD operations in the browser
- **Code Examples**: Ready-to-use snippets in multiple languages
- **Schema Visualization**: Complete data model documentation
- **Response Examples**: See expected API responses

## 📊 Real-time Analytics API

### Analytics Endpoints

#### Get Metrics
```bash
GET /api/analytics?type=metrics
```
Returns comprehensive API metrics including request counts, response times, and error rates.

#### Get Recent Requests
```bash
GET /api/analytics?type=requests&limit=100
```
Returns the most recent API requests with full details.

#### Real-time Stream
```bash
GET /api/analytics/stream
```
Server-Sent Events stream for real-time analytics updates.

#### Clear Analytics Data
```bash
DELETE /api/analytics?clearAll=true
```
Clears all analytics data (useful for testing or privacy).

### Analytics Data Structure

```typescript
interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  topEndpoints: Array<{
    path: string;
    count: number;
    avgResponseTime: number;
  }>;
  httpMethods: Record<string, number>;
  statusCodes: Record<string, number>;
  errorTypes: Record<string, number>;
  hourlyStats: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }>;
  dailyStats: Array<{
    date: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }>;
}

interface RealtimeStats {
  activeConnections: number;
  requestsLastMinute: number;
  errorsLastMinute: number;
  averageResponseTimeLastMinute: number;
  currentLoad: number;
}
```

## 📮 Postman Collection API

### Export Endpoint

#### Download Postman Collection
```bash
GET /api/postman
```
Returns a complete Postman v2.1.0 collection with all enabled API endpoints.

**Response Headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="api-collection.postman_collection.json"
```

### Collection Structure

```typescript
interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
    version: string;
  };
  item: PostmanFolder[];
  variable: PostmanVariable[];
}

interface PostmanFolder {
  name: string;
  description: string;
  item: PostmanRequest[];
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanBody;
    description: string;
  };
}
```

## 📋 CRUD API Examples

### Create a New User (POST)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user"
  }'
```

**Response:**
```json
{
  "id": 4,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "user",
  "createdAt": "2024-01-20T10:30:00Z",
  "updatedAt": "2024-01-20T10:30:00Z"
}
```

### Get All Users (GET)
```bash
curl http://localhost:3000/api/users
```

### Get Specific User (GET)
```bash
curl http://localhost:3000/api/users/1
```

### Update User (PUT)
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "admin"
  }'
```

### Partial Update (PATCH)
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"role": "moderator"}'
```

### Delete User (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

**Response:**
```json
{
  "message": "Item with id '1' deleted successfully",
  "deletedItem": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "admin"
  }
}
```

## 📋 Sample Files

### Sample JSON Data
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "website": "https://johndoe.dev",
      "birthDate": "1990-05-15",
      "createdAt": "2024-01-15T10:30:00Z",
      "phone": "+1234567890",
      "isActive": true,
      "role": "admin"
    }
  ],
  "products": [
    {
      "id": 101,
      "name": "Wireless Headphones",
      "price": 99.99,
      "description": "High-quality wireless headphones",
      "category": "Electronics",
      "inStock": true,
      "tags": ["audio", "wireless", "electronics"]
    }
  ]
}
```

### Sample JSON Schema
```json
{
  "type": "object",
  "properties": {
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string", "minLength": 1 },
          "email": { "type": "string", "format": "email" },
          "website": { "type": "string", "format": "uri" },
          "birthDate": { "type": "string", "format": "date" },
          "createdAt": { "type": "string", "format": "date-time" },
          "phone": { "type": "string", "format": "phone" },
          "isActive": { "type": "boolean" },
          "role": { 
            "type": "string", 
            "enum": ["admin", "user", "moderator"] 
          }
        },
        "required": ["id", "name", "email"],
        "additionalProperties": false
      }
    }
  },
  "required": ["users"],
  "additionalProperties": false
}
```

## 🔧 Complete API Reference

### Collection Operations

#### Get All Items
```
GET /api/{resource}
```
Returns all items in the collection.

#### Create New Item
```
POST /api/{resource}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```
Creates a new item. ID is auto-generated if not provided.

### Individual Item Operations

#### Get Specific Item
```
GET /api/{resource}/{id}
```
Returns a specific item by ID.

#### Replace Entire Item
```
PUT /api/{resource}/{id}
Content-Type: application/json

{
  "field1": "new_value1",
  "field2": "new_value2"
}
```
Replaces the entire item with new data.

#### Partial Update
```
PATCH /api/{resource}/{id}
Content-Type: application/json

{
  "field1": "updated_value"
}
```
Updates only the specified fields.

#### Delete Item
```
DELETE /api/{resource}/{id}
```
Permanently removes the item.

### Documentation & Export Endpoints
```
GET /api/swagger                    # Get OpenAPI 3.0 specification
GET /api/postman                    # Download Postman collection
```

### Analytics Endpoints
```
GET /api/analytics?type=metrics     # Get comprehensive metrics
GET /api/analytics?type=requests    # Get recent requests
GET /api/analytics/stream           # Real-time SSE stream
DELETE /api/analytics?clearAll=true # Clear all analytics data
```

## 🛠️ Technical Details

### Built With
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **AJV** - JSON Schema validator with format support
- **Swagger UI React** - Interactive API documentation
- **Recharts** - Beautiful analytics charts and visualizations
- **Lucide React** - Beautiful icons
- **Server-Sent Events** - Real-time analytics streaming

### CRUD Features
- **Automatic ID Generation**: Smart ID assignment for new items
- **Timestamp Management**: Automatic createdAt/updatedAt handling
- **Data Validation**: All operations validate against JSON schema
- **Error Handling**: Comprehensive error responses with details
- **Data Persistence**: All changes saved to file system
- **ID Flexibility**: Supports id, _id, and uuid fields

### Analytics Architecture
- **Real-time Processing**: Immediate request logging and analysis
- **In-memory Storage**: Fast access to recent data with file persistence
- **Efficient Caching**: 30-second cache for metrics with automatic invalidation
- **Data Retention**: 7-day rolling window with automatic cleanup
- **Performance Optimized**: Minimal overhead on API requests
- **Scalable Design**: Handles high-volume API traffic efficiently

### Postman Integration
- **Postman v2.1.0 Format**: Industry-standard collection format
- **Dynamic Generation**: Collections generated from current data and schema
- **Smart Sampling**: Realistic examples based on actual data
- **Environment Support**: Base URL variables for different environments
- **Comprehensive Coverage**: All CRUD operations with proper documentation
- **Team Collaboration**: Easy sharing and version control

### Architecture
- **File-based Storage**: Persistent data storage using the file system
- **Server-side Validation**: Secure validation on the backend
- **Dynamic API Generation**: Runtime API endpoint creation
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: WebSocket-like experience with SSE

## 🔒 Security Features

- Server-side validation only
- No client-side data exposure
- Automatic data expiration
- Input sanitization and validation
- No persistent database required
- Schema-based validation for all operations
- Analytics data isolation and privacy controls

## 📊 Analytics Privacy & Data Management

### Data Retention
- **7-day retention** for detailed request logs
- **Automatic cleanup** of old data
- **Manual reset** option for complete data clearing
- **Session isolation** - each validation session is independent

### Privacy Controls
- **No personal data** stored in analytics (only request metadata)
- **IP anonymization** options
- **User agent filtering** for privacy
- **Complete data export** for transparency
- **Instant data deletion** with reset functionality

### Performance Impact
- **Minimal overhead** - less than 1ms per request
- **Asynchronous logging** - no impact on API response times
- **Efficient storage** - optimized data structures
- **Memory management** - automatic cleanup and garbage collection

## 🐳 Docker Deployment

### Quick Start with Docker
```bash
# Build the image
docker build -t json-schema-api .

# Run the container
docker run -d \
  --name json-api \
  -p 3000:3000 \
  -v json_data:/app/.data \
  json-schema-api
```

### Docker Compose
```bash
# Start with Docker Compose
docker-compose up -d

# With production setup
docker-compose --profile production up -d
```

### Environment Variables
No environment variables required for basic functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**"No valid data available" Error**
- Ensure both JSON and Schema files are uploaded
- Check that validation was successful
- Try refreshing the page and re-uploading

**Validation Errors**
- Check that your JSON data matches the schema structure
- Verify format fields (email, date, etc.) are correctly formatted
- Use the sample files as a reference

**CRUD Operations Not Working**
- Ensure validation was successful first
- Check that your data contains arrays (collections)
- Verify the endpoint URLs and HTTP methods are correct
- Check request body format for POST/PUT/PATCH operations

**Analytics Not Updating**
- Check browser console for JavaScript errors
- Ensure the analytics stream connection is active
- Try refreshing the analytics page
- Verify that API requests are being made to generate data

**Postman Collection Issues**
- Ensure you have valid data and endpoints configured
- Check that the download completed successfully
- Verify the file is a valid JSON format
- Try re-downloading if import fails

### Getting Help

- 📧 Contact: **Thomas Rieger** at t.rieger@quickline.ch
- 💬 Create an issue on GitHub
- 📖 Review the documentation above

## 🎯 Roadmap

- [x] ✅ Complete CRUD operations (GET, POST, PUT, PATCH, DELETE)
- [x] ✅ Automatic ID generation and timestamp management
- [x] ✅ Comprehensive validation for all operations
- [x] ✅ Interactive Swagger documentation for all methods
- [x] ✅ **Real-time analytics and monitoring dashboard**
- [x] ✅ **Live performance metrics and request tracking**
- [x] ✅ **Historical data analysis and visualization**
- [x] ✅ **Server-Sent Events for real-time updates**
- [x] ✅ **Export to Postman collections with complete CRUD operations**
- [x] ✅ **Organized collection structure with realistic examples**
- [x] ✅ **Environment variables and team collaboration support**
- [ ] 🔄 Database integration options (PostgreSQL, MongoDB)
- [ ] 🔄 Authentication/Authorization middleware
- [ ] 🔄 API rate limiting and throttling
- [ ] 🔄 Advanced analytics with custom metrics
- [ ] 🔄 Export to Insomnia collections
- [ ] 🔄 GraphQL endpoint generation
- [ ] 🔄 Webhook support for data changes
- [ ] 🔄 Custom validation rules and middleware
- [ ] 🔄 Analytics alerting and notifications
- [ ] 🔄 Multi-tenant analytics isolation
- [ ] 🔄 Postman environment file generation
- [ ] 🔄 Collection versioning and change tracking

---

**Developed by Thomas Rieger** | **Made with ❤️ using Next.js and modern web technologies**

**🎉 Now with Complete CRUD Operations + Real-time Analytics + Postman Export! Create, Read, Update, Delete with full validation, documentation, live monitoring, and instant Postman collection generation.**

**📊 Monitor every API call in real-time with beautiful charts, performance metrics, and comprehensive analytics dashboard!**

**📮 Export complete Postman collections with all CRUD operations, realistic examples, and team collaboration features!**