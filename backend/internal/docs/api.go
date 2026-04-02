package docs

import (
	"encoding/json"
	"net/http"
)

// OpenAPISpec represents the OpenAPI 3.0 specification
type OpenAPISpec struct {
	OpenAPI    string                 `json:"openapi"`
	Info       Info                   `json:"info"`
	Servers    []Server               `json:"servers"`
	Paths      map[string]PathItem    `json:"paths"`
	Components Components             `json:"components"`
	Tags       []Tag                  `json:"tags"`
}

type Info struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	Version        string `json:"version"`
	Contact        Contact `json:"contact"`
	License        License `json:"license"`
}

type Contact struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	URL   string `json:"url"`
}

type License struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type Server struct {
	URL         string `json:"url"`
	Description string `json:"description"`
}

type PathItem struct {
	Get    *Operation `json:"get,omitempty"`
	Post   *Operation `json:"post,omitempty"`
	Put    *Operation `json:"put,omitempty"`
	Delete *Operation `json:"delete,omitempty"`
}

type Operation struct {
	Tags        []string              `json:"tags"`
	Summary     string                `json:"summary"`
	Description string                `json:"description"`
	OperationID string                `json:"operationId"`
	Parameters  []Parameter           `json:"parameters,omitempty"`
	RequestBody *RequestBody          `json:"requestBody,omitempty"`
	Responses   map[int]Response       `json:"responses"`
	Security    []map[string][]string  `json:"security,omitempty"`
}

type Parameter struct {
	Name        string `json:"name"`
	In          string `json:"in"`
	Description string `json:"description"`
	Required    bool   `json:"required"`
	Schema      Schema `json:"schema"`
}

type RequestBody struct {
	Description string                `json:"description"`
	Required    bool                  `json:"required"`
	Content     map[string]MediaType  `json:"content"`
}

type Response struct {
	Description string               `json:"description"`
	Content     map[string]MediaType `json:"content,omitempty"`
}

type MediaType struct {
	Schema Schema `json:"schema"`
}

type Schema struct {
	Type       string             `json:"type"`
	Properties map[string]Schema  `json:"properties,omitempty"`
	Items      *Schema            `json:"items,omitempty"`
	Required   []string           `json:"required,omitempty"`
	Example    interface{}        `json:"example,omitempty"`
}

type Components struct {
	Schemas   map[string]Schema   `json:"schemas"`
	SecuritySchemes map[string]SecurityScheme `json:"securitySchemes"`
}

type SecurityScheme struct {
	Type        string `json:"type"`
	Description string `json:"description"`
	Name        string `json:"name,omitempty"`
	In          string `json:"in,omitempty"`
	BearerFormat string `json:"bearerFormat,omitempty"`
}

type Tag struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// GetAPISpec returns the OpenAPI specification for the API
func GetAPISpec() *OpenAPISpec {
	return &OpenAPISpec{
		OpenAPI: "3.0.0",
		Info: Info{
			Title:       "SolvingHub API",
			Description: "A platform for discovering and solving real-world problems",
			Version:     "1.0.0",
			Contact: Contact{
				Name:  "SolvingHub Team",
				Email: "api@solvinghub.com",
				URL:   "https://solvinghub.com",
			},
			License: License{
				Name: "MIT",
				URL:  "https://opensource.org/licenses/MIT",
			},
		},
		Servers: []Server{
			{
				URL:         "http://localhost:8080",
				Description: "Development server",
			},
			{
				URL:         "https://api.solvinghub.com",
				Description: "Production server",
			},
		},
		Tags: []Tag{
			{Name: "Authentication", Description: "OAuth and JWT authentication"},
			{Name: "Problems", Description: "Problem management"},
			{Name: "Solutions", Description: "Solution management"},
			{Name: "Comments", Description: "Comment and reply system"},
			{Name: "Votes", Description: "Voting system"},
			{Name: "Users", Description: "User profiles and rankings"},
		},
		Paths: map[string]PathItem{
			"/api/v1/auth/google": {
				Get: &Operation{
					Tags:        []string{"Authentication"},
					Summary:     "Initiate Google OAuth flow",
					Description: "Redirects user to Google's OAuth consent page",
					OperationID: "googleLogin",
					Responses: map[int]Response{
						302: {Description: "Redirect to Google OAuth"},
					},
				},
			},
			"/api/v1/auth/google/callback": {
				Get: &Operation{
					Tags:        []string{"Authentication"},
					Summary:     "Handle Google OAuth callback",
					Description: "Exchanges OAuth code for JWT and redirects to frontend",
					OperationID: "googleCallback",
					Parameters: []Parameter{
						{Name: "code", In: "query", Description: "OAuth authorization code", Required: true, Schema: Schema{Type: "string"}},
						{Name: "state", In: "query", Description: "OAuth state parameter", Required: true, Schema: Schema{Type: "string"}},
					},
					Responses: map[int]Response{
						302: {Description: "Redirect to frontend with auth token"},
						400: {Description: "Missing or invalid parameters"},
						500: {Description: "Authentication failed"},
					},
				},
			},
			"/api/v1/auth/logout": {
				Post: &Operation{
					Tags:        []string{"Authentication"},
					Summary:     "Logout user",
					Description: "Clears authentication cookie",
					OperationID: "logout",
					Responses: map[int]Response{
						200: {Description: "Successfully logged out"},
					},
				},
			},
			"/api/v1/problems": {
				Get: &Operation{
					Tags:        []string{"Problems"},
					Summary:     "List all problems",
					Description: "Returns a paginated list of problems",
					OperationID: "listProblems",
					Parameters: []Parameter{
						{Name: "page", In: "query", Description: "Page number", Required: false, Schema: Schema{Type: "integer"}},
						{Name: "limit", In: "query", Description: "Items per page", Required: false, Schema: Schema{Type: "integer"}},
						{Name: "category", In: "query", Description: "Filter by category", Required: false, Schema: Schema{Type: "string"}},
					},
					Responses: map[int]Response{
						200: {Description: "List of problems"},
					},
				},
				Post: &Operation{
					Tags:        []string{"Problems"},
					Summary:     "Create a new problem",
					Description: "Creates a new problem with the provided details",
					OperationID: "createProblem",
					Security:    []map[string][]string{{"bearerAuth": []string{}}},
					RequestBody: &RequestBody{
						Description: "Problem details",
						Required:    true,
						Content: map[string]MediaType{
							"application/json": {Schema: Schema{Type: "object"}},
						},
					},
					Responses: map[int]Response{
						201: {Description: "Problem created successfully"},
						400: {Description: "Invalid input"},
						401: {Description: "Authentication required"},
					},
				},
			},
		},
		Components: Components{
			Schemas: map[string]Schema{
				"Problem": {
					Type: "object",
					Properties: map[string]Schema{
						"id":           {Type: "string"},
						"title":        {Type: "string"},
						"description":  {Type: "string"},
						"category":     {Type: "string"},
						"tags":         {Type: "array", Items: &Schema{Type: "string"}},
						"impacts":      {Type: "array", Items: &Schema{Type: "string"}},
						"challenges":   {Type: "array", Items: &Schema{Type: "string"}},
						"votes":        {Type: "integer"},
						"discussions":  {Type: "integer"},
						"createdAt":    {Type: "string"},
						"submittedBy":  {Type: "string"},
					},
					Required: []string{"title", "description", "category"},
				},
				"CreateProblemRequest": {
					Type: "object",
					Properties: map[string]Schema{
						"title":       {Type: "string"},
						"description": {Type: "string"},
						"category":    {Type: "string"},
						"tags":        {Type: "array", Items: &Schema{Type: "string"}},
						"impacts":     {Type: "array", Items: &Schema{Type: "string"}},
						"challenges":  {Type: "array", Items: &Schema{Type: "string"}},
						"difficulty":   {Type: "string"},
					},
					Required: []string{"title", "description", "category", "difficulty"},
				},
			},
			SecuritySchemes: map[string]SecurityScheme{
				"bearerAuth": {
					Type:         "http",
					BearerFormat: "JWT",
					Description:  "JWT authentication token",
				},
			},
		},
	}
}

// APIDocHandler serves the OpenAPI specification
func APIDocHandler(w http.ResponseWriter, r *http.Request) {
	spec := GetAPISpec()
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	if err := json.NewEncoder(w).Encode(spec); err != nil {
		http.Error(w, "Failed to encode API documentation", http.StatusInternalServerError)
	}
}
