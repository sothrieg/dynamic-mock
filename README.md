# JSON Schema API Generator

A powerful Next.js application that automatically generates **full CRUD REST API endpoints** from your JSON data and JSON Schema files. Upload your files, validate them with enhanced format checking, and instantly get production-ready API endpoints with interactive Swagger documentation.

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

### 💾 **Persistent Data Storage**
- File-based data storage for reliability
- Data persists between server restarts
- All CRUD operations update persistent storage
- Automatic data expiration (24 hours) for security
- Graceful error handling and recovery

### 🎨 **Beautiful UI/UX**
- Modern, responsive design with Tailwind CSS
- Color-coded HTTP method badges with icons
- Drag-and-drop file upload interface
- Real-time validation feedback
- Copy-to-clipboard functionality for API endpoints
- Gradient backgrounds and smooth animations
- Mobile-friendly responsive design

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
- 📋 List of all generated CRUD API endpoints
- 📚 Link to interactive Swagger documentation

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

### Step 4: Explore Documentation

Click "View Documentation" to access the interactive Swagger UI where you can:
- Browse all available CRUD endpoints
- Test all HTTP methods directly in the browser
- View request/response schemas
- Copy curl commands
- Download OpenAPI specification

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

### Documentation Endpoint
```
GET /api/swagger
```
Returns the complete OpenAPI 3.0 specification.

## 🛠️ Technical Details

### Built With
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **AJV** - JSON Schema validator with format support
- **Swagger UI React** - Interactive API documentation
- **Lucide React** - Beautiful icons

### CRUD Features
- **Automatic ID Generation**: Smart ID assignment for new items
- **Timestamp Management**: Automatic createdAt/updatedAt handling
- **Data Validation**: All operations validate against JSON schema
- **Error Handling**: Comprehensive error responses with details
- **Data Persistence**: All changes saved to file system
- **ID Flexibility**: Supports id, _id, and uuid fields

### Architecture
- **File-based Storage**: Persistent data storage using the file system
- **Server-side Validation**: Secure validation on the backend
- **Dynamic API Generation**: Runtime API endpoint creation
- **Responsive Design**: Mobile-first approach

## 🔒 Security Features

- Server-side validation only
- No client-side data exposure
- Automatic data expiration
- Input sanitization and validation
- No persistent database required
- Schema-based validation for all operations

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

### Getting Help

- 📧 Contact: **Thomas Rieger** at t.rieger@quickline.ch
- 💬 Create an issue on GitHub
- 📖 Review the documentation above

## 🎯 Roadmap

- [x] ✅ Complete CRUD operations (GET, POST, PUT, PATCH, DELETE)
- [x] ✅ Automatic ID generation and timestamp management
- [x] ✅ Comprehensive validation for all operations
- [x] ✅ Interactive Swagger documentation for all methods
- [ ] 🔄 Database integration options (PostgreSQL, MongoDB)
- [ ] 🔄 Authentication/Authorization middleware
- [ ] 🔄 API rate limiting and throttling
- [ ] 🔄 Real-time API monitoring and analytics
- [ ] 🔄 Export to Postman collections
- [ ] 🔄 GraphQL endpoint generation
- [ ] 🔄 Webhook support for data changes
- [ ] 🔄 Custom validation rules and middleware

---

**Developed by Thomas Rieger** | **Made with ❤️ using Next.js and modern web technologies**

**🎉 Now with Complete CRUD Operations! Create, Read, Update, and Delete with full validation and documentation.**