# 🦌 Wildlife Camera Trap Dashboard

A modern, AI-powered wildlife monitoring dashboard built for the Environment Agency Abu Dhabi. This sophisticated web application provides real-time visualization and analysis of camera trap data across Abu Dhabi's protected areas.

## ✨ Features

### 🗺️ **Interactive Map Interface**

- Real-time camera locations with live status indicators
- Multiple map themes (Dark, GIX Blue)
- Smooth camera selection and navigation
- Animated markers with pulse effects for active cameras


### 📊 **Advanced Analytics**

- **Species Detection Charts** - Track wildlife activity over time
- **AI Model Performance** - Monitor detection accuracy across different models
- **Species Distribution** - Visualize wildlife population data
- **Timeline Analysis** - Interactive date range selection with smooth animations


### 🤖 **AI-Powered Detection**

- Support for multiple AI models (YOLOv8, EfficientDet, Detectron2, UAE-Custom)
- Real-time confidence scoring
- Bounding box visualization
- Model performance tracking


### 📱 **Modern UI/UX**

- **Glassmorphism Design** - Beautiful backdrop blur effects
- **Responsive Layout** - Works seamlessly on all devices
- **Dark Theme** - Easy on the eyes for extended monitoring
- **Smooth Animations** - Polished interactions throughout


### 🔍 **Detection Management**

- Detailed detection viewer with image annotations
- Downloadable detection images
- Camera-specific filtering
- Real-time detection feed


## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Maps**: Mapbox GL JS
- **Charts**: Custom SVG-based visualizations
- **Icons**: Lucide React
- **Deployment**: Vercel


## 🚀 Getting Started

\`\`\`shellscript
# Clone the repository
git clone https://github.com/yourusername/wildlife-camera-trap-dashboard.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Mapbox token to .env.local

# Run the development server
npm run dev
\`\`\`

## 🌍 Environment Variables

Create a `.env.local` file in the root directory and add your Mapbox token:

\`\`\`plaintext
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
\`\`\`

You can get a free Mapbox token by signing up at [mapbox.com](https://www.mapbox.com/).

## 🎯 Use Cases

- **Wildlife Conservation** - Monitor endangered species populations
- **Research** - Analyze animal behavior patterns and migration routes
- **Park Management** - Track camera health and optimize placement
- **Environmental Protection** - Detect illegal activities in protected areas


## 🔮 Future Enhancements

- Real-time WebSocket integration
- Machine learning model training interface
- Advanced filtering and search capabilities
- Export functionality for research data
- Mobile app companion
- Multi-language support


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Environment Agency Abu Dhabi for the project inspiration
- Mapbox for the beautiful mapping platform
- The open-source community for the amazing tools and libraries


---

**Built with ❤️ for wildlife conservation**
