# 🧙♂️ SpellShape WebApp

[
[
[

**SpellShape WebApp** is the visual editor and runtime engine for the `.spell` parametric 3D format. This SvelteKit application provides an intuitive interface for creating, editing, and viewing parametric 3D models using natural language and direct JSON manipulation.

> 🌟 **Part of the [SpellShape](https://github.com/StepanKukharskiy/spellshape) ecosystem** - an AI-native platform for parametric 3D design.

## ✨ Features

### 🎨 **Visual Editor**
- **Split-pane interface** with resizable sidebar and 3D viewport
- **Dual editing modes**: Natural language prompts and direct JSON editing
- **Real-time preview** with instant parameter updates
- **Smart camera controls** with automatic fit-to-scene and standard views (top, front, left, etc.)

### 🤖 **AI Integration**
- **Natural language to 3D**: Describe your model and generate `.spell` files
- **Iterative refinement**: Ask AI to modify existing models
- **Smart parameter extraction**: Automatic GUI generation from `.spell` schemas

### 🔧 **Advanced 3D Engine**
- **Parametric runtime**: Built on Three.js with custom `.spell` interpreter
- **Material system**: PBR materials with automatic lighting setup
- **Export capabilities**: OBJ and Grasshopper (.ghx) export
- **Performance optimized**: Efficient geometry caching and updates

### ⌨️ **Professional Workflow**
- **Keyboard shortcuts**: F (fit), 1-6 (views), Ctrl+E (export)
- **Live validation**: Real-time JSON syntax and schema checking
- **Version tracking**: Track changes to prompts and schema modifications
- **Responsive design**: Works on desktop and tablet devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/StepanKukharskiy/spellshape-webapp.git
cd spellshape-webapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to open the SpellShape editor.

### Environment Setup

Create a `.env` file for AI integration:

```env
# OpenAI API (for natural language to 3D)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Other AI providers
ANTHROPIC_API_KEY=your_anthropic_key_here
```

## 🏗️ Architecture

### Core Modules

```
lib/modules/
├── interpreter/           # .spell format parser and runtime
│   ├── evaluator.js      # Expression evaluation engine
│   ├── processor.js      # Template expansion and parameter resolution
│   ├── sceneBuilder.js   # Three.js scene construction
│   ├── materials.js      # PBR material management
│   └── validator.js      # Schema validation and constraints
├── plugins/
│   ├── geometry.js       # Three.js geometry factories
│   └── distribution.js   # Spatial distribution algorithms
├── framework.js          # Three.js setup and rendering loop
└── guiControls.js        # dat.GUI parameter interface
```

### Key Technologies

- **SvelteKit**: Modern web framework with SSR support
- **Three.js**: 3D rendering and scene management
- **TypeScript**: Type-safe development
- **dat.GUI**: Automatic parameter control generation

## 📝 Usage

### Creating Models

1. **From Natural Language**:
   ```
   Create a modern dining chair with oak wood seat and steel legs
   ```

2. **Direct JSON Editing**:
   ```json
   {
     "version": "3.1",
     "type": "parametric_scene",
     "children": [{
       "type": "parametric_template",
       "id": "dining_chair",
       "parameters": {
         "seat_width": { "value": 0.45, "type": "number", "min": 0.35, "max": 0.6 }
       }
     }]
   }
   ```

3. **Iterative Refinement**:
   - Use the chat interface to modify existing models
   - "Make the chair taller" or "Change material to metal"

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F` | Fit camera to scene |
| `1-6` | Standard views (front, back, left, right, top, bottom) |
| `Ctrl/Cmd + E` | Export as OBJ |
| `Ctrl/Cmd + Enter` | Apply JSON changes |

## 🔌 API Integration

### AI Generation Endpoint

```typescript
// POST /api/generateJson
{
  "prompt": "Create a parametric bookshelf",
  "schema": { /* existing schema for modifications */ },
  "regenerateFromPrompt": boolean
}
```

### Export Formats

- **OBJ**: Standard 3D mesh format
- **GHX**: Grasshopper definition for Rhino integration
- **JSON**: Native `.spell` format

## 🎯 .spell Format Support

This webapp implements the complete SpellShape schema v3.1:

### Geometry Types
- `box`, `cylinder`, `sphere`, `plane`, `torus`, `cone`

### Distribution Patterns
- `linear`: Linear arrays with start/step
- `grid`: Custom position grids
- `radial`: Circular arrangements

### Expression System
- Parameter references: `$width`, `$height`
- Math functions: `sin`, `cos`, `min`, `max`, `clamp`
- Conditionals: `if(condition, a, b)`

### Material System
- PBR materials with `color`, `roughness`, `metalness`
- Automatic Three.js material generation

## 🛠️ Development

### Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main editor interface
│   └── api/
│       └── generateJson/     # AI generation endpoint
├── lib/
│   ├── modules/              # Core SpellShape interpreter
│   ├── stores/               # Svelte state management
│   └── components/           # Reusable UI components
└── app.html                  # HTML template
```

### Building

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm run test

# Type checking
npm run check
```

## 🤝 Contributing

We welcome contributions! Areas where help is needed:

- **New geometry types**: Extend the geometry plugin system
- **Export formats**: Add support for glTF, STEP, etc.
- **UI improvements**: Better mobile support, accessibility
- **Performance**: Optimize large scene handling
- **Documentation**: Examples and tutorials

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Submit a pull request with clear description

## 📚 Related Projects

- [`spellshape`](https://github.com/StepanKukharskiy/spellshape) - Main project hub
- [`spellshape-format`](https://github.com/StepanKukharskiy/spellshape-format) - Schema specification
- [`spellshape-three`](https://github.com/StepanKukharskiy/spellshape-three) - Core Three.js runtime
- [`spellshape-examples`](https://github.com/StepanKukharskiy/spellshape-examples) - Example models

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🚧 Roadmap

- [ ] **Multi-file projects**: Support for component libraries
- [ ] **Collaboration**: Real-time multi-user editing
- [ ] **Version control**: Git-like versioning for `.spell` files
- [ ] **Plugin system**: Custom geometry and material plugins
- [ ] **Mobile app**: Native iOS/Android viewers

## 💬 Community

- **Issues**: [Report bugs](https://github.com/StepanKukharskiy/spellshape-webapp/issues)
- **Discussions**: [Join conversations](https://github.com/StepanKukharskiy/spellshape/discussions)
- **Discord**: [SpellShape Community](https://discord.gg/spellshape) *(coming soon)*

*Built with ❤️ for the future of parametric design*

[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/40074926/e72090ef-bdb6-4703-b494-3b7399d9df0d/paste.txt