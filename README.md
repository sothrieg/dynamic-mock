# JSON Schema API Generator

A powerful Next.js application that automatically generates REST API endpoints from your JSON data and JSON Schema files. Upload your files, validate them with enhanced format checking, and instantly get production-ready API endpoints with interactive Swagger documentation.

![JSON Schema API Generator](https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## ✨ Features

### 🚀 **Automatic API Generation**
- Upload JSON data and JSON Schema files
- Automatically generates RESTful API endpoints
- Supports collection and individual item endpoints
- No coding required - just upload and go!

### 🔍 **Enhanced Validation**
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
- Detailed error messages with field-specific feedback
- Real-time validation results

### 📚 **Interactive Documentation**
- Auto-generated Swagger/OpenAPI 3.0 documentation
- Interactive API testing interface
- Try endpoints directly from the documentation
- Automatic schema generation from your data
- Professional API documentation ready for production

### 💾 **Data Persistence**
- File-based data storage for reliability
- Data persists between server restarts
- Automatic data expiration (24 hours) for security
- Graceful error handling and recovery

### 🎨 **Beautiful UI/UX**
- Modern, responsive design with Tailwind CSS
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

### Step 3: Use Your APIs

After successful validation, you'll see:
- ✅ Validation success message
- 📋 List of generated API endpoints
- 📚 Link to interactive Swagger documentation

#### Generated Endpoints

For each array in your JSON data, you get:

**Collection Endpoints:**
```
GET /api/{resource}
```
Returns all items in the collection.

**Individual Item Endpoints:**
```
GET /api/{resource}/{id}
```
Returns a specific item by ID.

### Step 4: Explore Documentation

Click "View Documentation" to access the interactive Swagger UI where you can:
- Browse all available endpoints
- Test APIs directly in the browser
- View request/response schemas
- Copy curl commands
- Download OpenAPI specification

## 📋 Example Files

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

## 🔧 API Reference

### Validation Endpoint
```
POST /api/validate
```
Validates JSON data against schema and generates API endpoints.

### Dynamic Resource Endpoints
```
GET /api/{resource}           # Get all items
GET /api/{resource}/{id}      # Get specific item
```

### Documentation Endpoint
```
GET /api/swagger              # Get OpenAPI specification
```

## 🛠️ Technical Details

### Built With
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **AJV** - JSON Schema validator with format support
- **Swagger UI React** - Interactive API documentation
- **Lucide React** - Beautiful icons

### Architecture
- **File-based Storage**: Persistent data storage using the file system
- **Server-side Validation**: Secure validation on the backend
- **Dynamic API Generation**: Runtime API endpoint creation
- **Responsive Design**: Mobile-first approach

### Data Storage
- Data is stored in `.data/store.json`
- Automatic cleanup after 24 hours
- Graceful error handling and recovery
- Git-ignored for security

## 🔒 Security Features

- Server-side validation only
- No client-side data exposure
- Automatic data expiration
- Input sanitization and validation
- No persistent database required

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
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

**API Endpoints Not Working**
- Ensure validation was successful first
- Check that your data contains arrays (collections)
- Verify the endpoint URLs are correct

### Getting Help

- 📧 Create an issue on GitHub
- 💬 Check existing issues for solutions
- 📖 Review the documentation above

## 🎯 Roadmap

- [ ] Support for POST/PUT/DELETE operations
- [ ] Database integration options
- [ ] Custom validation rules
- [ ] API rate limiting
- [ ] Authentication/Authorization
- [ ] Export to Postman collections
- [ ] GraphQL endpoint generation
- [ ] Real-time API monitoring

---

**Made with ❤️ using Next.js and modern web technologies**