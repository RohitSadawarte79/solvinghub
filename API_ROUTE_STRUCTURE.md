# 📂 API Route Structure Explanation

## Why Two route.js Files in Problems Folder?

This is **completely normal** and follows Next.js App Router conventions. Here's why:

---

## 🗂️ File Structure

```
src/app/api/problems/
│
├── route.js                      👈 Route #1 (Collection)
│
└── [id]/                         👈 Dynamic folder
    ├── route.js                  👈 Route #2 (Single item)
    ├── comments/
    │   └── route.js
    └── vote/
        └── route.js
```

---

## 🎯 Purpose of Each route.js

### **Route #1:** `/api/problems/route.js`
**Path:** `/api/problems`

**Purpose:** Handle **collections** of problems

**Endpoints:**
```javascript
GET  /api/problems              // List all problems (with pagination)
POST /api/problems              // Create a new problem
```

**Example Usage:**
```javascript
// Frontend calls:
fetch('/api/problems?limit=10&sort_by=votes')  // ✅ Uses route.js in /problems/
fetch('/api/problems', { method: 'POST', ... })  // ✅ Uses route.js in /problems/
```

---

### **Route #2:** `/api/problems/[id]/route.js`
**Path:** `/api/problems/[id]`

**Purpose:** Handle **individual** problems (by ID)

**Endpoints:**
```javascript
GET    /api/problems/:id        // Get a single problem
PATCH  /api/problems/:id        // Update a problem
DELETE /api/problems/:id        // Delete a problem
```

**Example Usage:**
```javascript
// Frontend calls:
fetch('/api/problems/123e4567-e89b-12d3-a456-426614174000')  // ✅ Uses route.js in /problems/[id]/
```

---

## 🔄 How Next.js Routes Requests

### Routing Logic:
```
URL: /api/problems
├─ Match: /api/problems/route.js ✅
└─ Result: Execute GET or POST handler

URL: /api/problems/abc-123
├─ Match: /api/problems/[id]/route.js ✅
└─ Result: Execute GET, PATCH, or DELETE handler
    with params.id = "abc-123"

URL: /api/problems/abc-123/vote
├─ Match: /api/problems/[id]/vote/route.js ✅
└─ Result: Execute vote handlers
```

---

## 📊 Complete API Structure

```
/api/problems/
│
├── route.js
│   ├── GET /api/problems                    → List problems
│   └── POST /api/problems                   → Create problem
│
└── [id]/
    ├── route.js
    │   ├── GET /api/problems/:id            → Get single problem
    │   ├── PATCH /api/problems/:id          → Update problem
    │   └── DELETE /api/problems/:id         → Delete problem
    │
    ├── comments/
    │   └── route.js
    │       ├── GET /api/problems/:id/comments   → List comments
    │       └── POST /api/problems/:id/comments  → Create comment
    │
    └── vote/
        └── route.js
            ├── GET /api/problems/:id/vote       → Check vote status
            └── POST /api/problems/:id/vote      → Toggle vote
```

---

## 🎓 RESTful API Pattern

This follows standard REST conventions:

| HTTP Method | Collection (/problems) | Item (/problems/:id) |
|-------------|------------------------|----------------------|
| **GET** | List all | Get one |
| **POST** | Create new | Not used |
| **PATCH** | Not used | Update one |
| **DELETE** | Not used | Delete one |

---

## ✅ Why This Design is Good

### 1. **Separation of Concerns**
- Collection operations (list, create) in one file
- Individual operations (read, update, delete) in another

### 2. **Clean URLs**
```
/api/problems           ← Collection
/api/problems/:id       ← Single item
/api/problems/:id/vote  ← Sub-resource
```

### 3. **Scalability**
Easy to add more routes:
```
/api/problems/[id]/solutions/
/api/problems/[id]/tags/
/api/problems/[id]/history/
```

### 4. **Type Safety**
TypeScript can validate:
```typescript
// Collection: no ID needed
GET /api/problems

// Item: ID required
GET /api/problems/[id]  // params.id exists
```

---

## 🔍 How to Know Which Route Handles What

### Rule of Thumb:
1. **Base route** (`/api/problems/route.js`)
   - Handles: `/api/problems` exactly
   - No ID in URL

2. **Dynamic route** (`/api/problems/[id]/route.js`)
   - Handles: `/api/problems/ANYTHING`
   - ID captured in `params.id`

3. **Nested routes** (`/api/problems/[id]/comments/route.js`)
   - Handles: `/api/problems/ANYTHING/comments`
   - ID captured in `params.id`

---

## 💡 Analogy

Think of it like a file system:

```bash
# Collection = Directory listing
ls /problems/                    # GET /api/problems
mkdir /problems/new              # POST /api/problems

# Item = Specific file operations
cat /problems/file1.txt          # GET /api/problems/:id
rm /problems/file1.txt           # DELETE /api/problems/:id
```

---

## 🎯 Summary

**Question:** Why two route.js files?

**Answer:** 
- `/api/problems/route.js` → Handles **collection** (list/create)
- `/api/problems/[id]/route.js` → Handles **individual items** (get/update/delete)

This is **standard Next.js App Router pattern** for building RESTful APIs.

**Both files are necessary and serve different purposes!** ✅

---

## 📚 Further Reading

- [Next.js App Router Routing](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
