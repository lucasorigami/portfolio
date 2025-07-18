const keyValues = window.location.search;

const urlParams = new URLSearchParams(keyValues);
const graphId = urlParams.get("id");

let graphData = null; // This will hold the loaded data


async function getData() {
  const url = `graph.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    graphData = await response.json();
    console.log("Graph data loaded:", graphData);
    
    // Call any functions that need to use the graphData here
    initializeVisualization();
  } catch (error) {
    console.error("Error loading graph data:", error.message);
  }
}

// Helper to open popover and type out content using the static popover in index.html
function openPopoverWithTypewriter(nodeData) {
    const backdrop = document.getElementById('popover-backdrop');
    const popover = document.getElementById('popover');
    const contentDiv = document.getElementById('content');
    const xButton = document.getElementById('x-button');
    if (!backdrop || !popover || !contentDiv || !xButton) return;

    // Show the popover
    backdrop.style.display = 'flex';
    contentDiv.innerHTML = '';

    // Prepare JSON string and syntax highlight wrapper
    const filteredData = {};
    ["node", "images", "description", "active", "year", "technologies", "tools"].forEach(key => {
        if (nodeData[key] !== undefined) filteredData[key] = nodeData[key];
    });
    const jsonString = JSON.stringify(filteredData, null, 2);
    const code = document.createElement('code');
    code.className = 'language-json';
    contentDiv.appendChild(code);

    // Track which sections have been rendered
    let renderedH2 = false;
    let renderedImages = false;
    let renderedDesc = false;
    let renderedYear = false;
    let renderedActive = false;
    let renderedTech = false;
    let renderedTools = false;

    // Store HTML elements for each field (now as structured blocks)
    const htmlElements = {
        node: null,
        images: null,
        description: null,
        year: null,
        active: null,
        technologies: null,
        tools: null
    };

    // Buffer for the code block, so we can remove JSON fields as we render them
    let codeBuffer = '';

    // Helper to check and render elements as soon as their JSON finishes typing
    function checkAndRender() {
        // 1. node (title)
        if (!renderedH2) {
            const nodeMatch = codeBuffer.match(/\s*,?\s*"node":\s*"([^"]*)"\s*,?/);
            if (nodeMatch) {
                renderedH2 = true;
                codeBuffer = codeBuffer.replace(nodeMatch[0], '{{FIELD_NODE}}');
                codeBuffer = codeBuffer.replace(/^[\s,\"]+/, '');
                const h2 = document.createElement('h2');
                h2.textContent = nodeMatch[1];
                htmlElements.node = h2;
            }
        }
        // 2. images
        if (!renderedImages) {
            const imagesMatch = codeBuffer.match(/\s*,?\s*"images":\s*\[(.*?)\]\s*,?/s);
            if (imagesMatch) {
                renderedImages = true;
                codeBuffer = codeBuffer.replace(imagesMatch[0], '{{FIELD_IMAGES}}');
                codeBuffer = codeBuffer.replace(/^[\s,\"]+/, '');
                try {
                    const arr = JSON.parse('[' + imagesMatch[1].replace(/\n/g, '').replace(/\s+/g, '') + ']');
                    if (Array.isArray(arr) && arr.length > 0) {
                        const imgContainer = document.createElement('div');
                        imgContainer.style.margin = '20px 0';
                        arr.forEach(src => {
                            const img = document.createElement('img');
                            img.src = src;
                            img.style.maxWidth = '200px';
                            img.style.margin = '10px';
                            imgContainer.appendChild(img);
                        });
                        htmlElements.images = imgContainer;
                    }
                } catch (e) {}
            }
        }
        // 3. description (as paragraphs)
        if (!renderedDesc) {
            const descMatch = codeBuffer.match(/\s*,?\s*"description":\s*"([^"]*)"\s*,?/);
            if (descMatch) {
                renderedDesc = true;
                codeBuffer = codeBuffer.replace(descMatch[0], '{{FIELD_DESCRIPTION}}');
                codeBuffer = codeBuffer.replace(/^[\s,\"]+/, '');
                const descDiv = document.createElement('div');
                descMatch[1].split(/\n\n+/).forEach(paragraph => {
                    const p = document.createElement('p');
                    p.innerHTML = paragraph.replace(/\n/g, '<br>');
                    descDiv.appendChild(p);
                });
                htmlElements.description = descDiv;
            }
        }
        // 4. year and 5. active (grouped in a single <p> with a single placeholder)
        if (!htmlElements.active_year) {
            // Find both year and active, in any order
            const yearMatch = codeBuffer.match(/\s*,?\s*"year":\s*"?([0-9]{4})"?\s*,?/);
            const activeMatch = codeBuffer.match(/\s*,?\s*"active":\s*(true|false)\s*,?/);
            if (yearMatch && activeMatch) {
                // Remove both from buffer (robustly)
                const yearIdx = codeBuffer.indexOf(yearMatch[0]);
                const activeIdx = codeBuffer.indexOf(activeMatch[0]);
                const startIdx = Math.min(yearIdx, activeIdx);
                const endIdx = Math.max(yearIdx + yearMatch[0].length, activeIdx + activeMatch[0].length);
                // Remove any trailing comma/quote after the removed substring
                let after = codeBuffer.slice(endIdx);
                after = after.replace(/^\s*,?\s*"?/, '');
                codeBuffer = codeBuffer.slice(0, startIdx) + '{{FIELD_ACTIVE_YEAR}}' + after;
                codeBuffer = codeBuffer.replace(/^[\s,\"]+/, '');
                // Build the HTML
                const p = document.createElement('p');
                const activeSpan = document.createElement('span');
                activeSpan.className = activeMatch[1] === 'true' ? 'active blinker' : 'passive';
                activeSpan.innerHTML = '&bull;&nbsp;';
                p.appendChild(activeSpan);
                const yearSpan = document.createElement('span');
                yearSpan.textContent = yearMatch[1];
                p.appendChild(yearSpan);
                htmlElements.active_year = p;
            }
        }
        // 6. technologies and 7. tools (grouped in a single <p> with a single placeholder)
        if (!htmlElements.tech_tools) {
            const techMatch = codeBuffer.match(/\s*,?\s*"technologies":\s*\[(.*?)\]\s*,?/s);
            const toolsMatch = codeBuffer.match(/\s*,?\s*"tools":\s*\[(.*?)\]\s*,?/s);
            if (techMatch || toolsMatch) {
                // Remove both from buffer (if present)
                let minIdx = codeBuffer.length;
                if (techMatch && codeBuffer.indexOf(techMatch[0]) < minIdx) minIdx = codeBuffer.indexOf(techMatch[0]);
                if (toolsMatch && codeBuffer.indexOf(toolsMatch[0]) < minIdx) minIdx = codeBuffer.indexOf(toolsMatch[0]);
                if (techMatch) codeBuffer = codeBuffer.replace(techMatch[0], '');
                if (toolsMatch) codeBuffer = codeBuffer.replace(toolsMatch[0], '');
                codeBuffer = codeBuffer.slice(0, minIdx) + '{{FIELD_TECH_TOOLS}}' + codeBuffer.slice(minIdx);
                codeBuffer = codeBuffer.replace(/^[\s,\"]+/, '');
                // Build the HTML
                const p = document.createElement('p');
                const span = document.createElement('span');
                span.className = 'medium';
                let html = '<b>Website</b> — ';
                let items = [];
                // Technologies
                if (techMatch) {
                    const arrStr = techMatch[1];
                    const techEntries = arrStr.match(/\{[^}]*\}|"[^"]*"/g) || [];
                    items = items.concat(techEntries.map(entry => {
                        if (entry.startsWith('{')) {
                            const nameMatch = entry.match(/"name":\s*"([^"]*)"/);
                            const urlMatch = entry.match(/"url":\s*"([^"]*)"/);
                            if (urlMatch) {
                                return `<a href="${urlMatch[1]}" target="_blank">${nameMatch ? nameMatch[1] : urlMatch[1]}</a>`;
                            } else if (nameMatch) {
                                return nameMatch[1];
                            }
                        } else if (entry.startsWith('"')) {
                            return entry.replace(/\"/g, '').replace(/"/g, '');
                        }
                        return '';
                    }));
                }
                // Tools
                if (toolsMatch) {
                    const arrStr = toolsMatch[1];
                    const toolEntries = arrStr.match(/\{[^}]*\}|"[^"]*"/g) || [];
                    items = items.concat(toolEntries.map(entry => {
                        if (entry.startsWith('{')) {
                            const nameMatch = entry.match(/"name":\s*"([^"]*)"/);
                            const urlMatch = entry.match(/"url":\s*"([^"]*)"/);
                            if (urlMatch) {
                                return `<a href="${urlMatch[1]}" target="_blank">${nameMatch ? nameMatch[1] : urlMatch[1]}</a>`;
                            } else if (nameMatch) {
                                return nameMatch[1];
                            }
                        } else if (entry.startsWith('"')) {
                            return entry.replace(/\"/g, '').replace(/"/g, '');
                        }
                        return '';
                    }));
                }
                html += items.join(', ');
                span.innerHTML = html;
                p.appendChild(span);
                htmlElements.tech_tools = p;
            }
        }
    }

    // Render the code block as a mix of text and HTML elements (with structured blocks)
    function renderCodeBlock() {
        contentDiv.innerHTML = '';
        const parts = codeBuffer.split(/(\{\{FIELD_[A-Z_]+\}\})/g);
        let techToolsRendered = false;
        let activeYearRendered = false;
        parts.forEach((part, idx) => {
            if (part.startsWith('{{FIELD_') && part.endsWith('}}')) {
                const key = part.replace(/\{\{FIELD_([A-Z_]+)\}\}/, (m, p1) => p1.toLowerCase());
                if (key === 'tech_tools' && !techToolsRendered) {
                    if (htmlElements.tech_tools) contentDiv.appendChild(htmlElements.tech_tools);
                    techToolsRendered = true;
                } else if (key === 'active_year' && !activeYearRendered) {
                    if (htmlElements.active_year) contentDiv.appendChild(htmlElements.active_year);
                    activeYearRendered = true;
                } else if (key !== 'technologies' && key !== 'tools' && key !== 'active' && key !== 'year') {
                    if (htmlElements[key]) contentDiv.appendChild(htmlElements[key]);
                }
            } else if (part.length > 0) {
                // Remove leading comma, quote, or comma+quote from the start of the part
                let cleanPart = part.replace(/^\s*(,|"|",)+/, '');
                if (cleanPart.length > 0 && !/^\s*,\s*$/.test(cleanPart)) {
                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    code.className = 'language-json';
                    code.textContent = cleanPart;
                    pre.appendChild(code);
                    contentDiv.appendChild(pre);
                    if (window.Prism && Prism.highlightElement) {
                        Prism.highlightElement(code);
                    }
                }
            }
        });
    }

    // Typewriter effect with syntax highlighting and real-time rendering
    // --- BEGIN PER-WORD TYPEWRITER MODIFICATION ---
    // Split jsonString into words, preserving spaces and newlines
    // This regex splits on word boundaries but keeps spaces and newlines as separate tokens
    const wordRegex = /(\S+|\s+)/g;
    const words = jsonString.match(wordRegex) || [];
    let i = 0;
    function typeWriter() {
        if (i < words.length) {
            codeBuffer += words[i];
            checkAndRender();
            renderCodeBlock();
            i++;
            setTimeout(typeWriter, 60); // Adjust speed as desired
        }
    }
    typeWriter();
    // --- END PER-WORD TYPEWRITER MODIFICATION ---

    // Close logic
    xButton.onclick = () => {
        backdrop.style.display = 'none';
        contentDiv.innerHTML = '';
    };
}

// External function to handle node click
function handleNodeClick(nodeData) {
    openPopoverWithTypewriter(nodeData);
}

// Example function that uses the graphData
function initializeVisualization() {
  if (!graphData) {

    return;
  }
  

        // Configuration
        const width = window.innerWidth;
        const height = window.innerHeight;
        const imageSize = 60;
        const imageSizeHalf = imageSize / 2;

        // Process data with timestamps
        const nodes = graphData.nodes.map(node => ({
            ...node,
            icon: node.images[0],
            x: Math.random() * width,
            y: Math.random() * height,
            created_at: new Date(node.created_at)
        }));

        const links = graphData.links.map(link => ({
            source: link.source,
            target: link.target
        }));

        // Sort nodes by creation time
        nodes.sort((a, b) => a.created_at - b.created_at);

        // Create a map of node IDs to their creation times for link timing
        const nodeTimingMap = new Map();
        nodes.forEach((node, index) => {
            nodeTimingMap.set(node.id, index);
        });

        // Calculate link timing based on when both connected nodes are visible
        const linksWithTiming = links.map(link => {
            const sourceIndex = nodeTimingMap.get(link.source);
            const targetIndex = nodeTimingMap.get(link.target);
            const linkIndex = Math.max(sourceIndex, targetIndex) + 1; // Link appears after both nodes
            return {
                ...link,
                timingIndex: linkIndex
            };
        });

        // Sort links by timing
        linksWithTiming.sort((a, b) => a.timingIndex - b.timingIndex);

        // Initialize SVG
        const svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);

        // Set up zoom
        const zoom = d3.zoom()
            // .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                zoomGroup.attr("transform", event.transform);
                
                // Check if zoom is beyond limits and show/hide reset button
                const currentScale = event.transform.k;
                if (currentScale < 0.1 || currentScale > 7) {
                    showResetZoomButton();
                } else {
                    hideResetZoomButton();
                }
            });

        svg.call(zoom);

        const zoomGroup = svg.append("g");

        // Create reset zoom button (initially hidden)
        const resetZoomButton = d3.select("body")
            .append("div")
            .attr("id", "reset-zoom-button")
            .text("⟳")
            .on("click", () => {
                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity);
            });

        function showResetZoomButton() {
            resetZoomButton
                .style("opacity", "1")
                .style("pointer-events", "auto");
        }

        function hideResetZoomButton() {
            resetZoomButton
                .style("opacity", "0")
                .style("pointer-events", "none");
        }

        // Define arrowhead marker and blur filter
        const defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 18)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "gray");
        
        // Create the blur filter and grab a reference to the feGaussianBlur
        const blurFilter = defs.append("filter")
            .attr("id", "blurFilter");
        
        const blur = blurFilter.append("feGaussianBlur")
            .attr("in", "SourceGraphic")
            .attr("stdDeviation", 10)
            .attr("result", "blur");
        
        // Optional: to ensure alpha transparency is preserved
        blurFilter.append("feComponentTransfer")
            .append("feFuncA")
            .attr("type", "linear")
            .attr("slope", 1);

        // Track hovered node and zoom state
        let hoveredNode = null;
        let isZoomedIn = false;
        let previousTransform = null;

        // Function to zoom to a specific node
        function zoomToNode(node) {
            const fullWidth = width;
            const fullHeight = height;

            // Define a "virtual" bounding box around the node
            const nodeSize = imageSize * 2; // or use actual node radius * 2
            const bounds = {
                x: node.x - nodeSize / 2,
                y: node.y - nodeSize / 2,
                width: nodeSize,
                height: nodeSize
            };

            const widthScale = (fullWidth * 2) / bounds.width;
            const heightScale = (fullHeight * 2) / bounds.height;
            const scale = Math.min(widthScale, heightScale);

            const translate = [
                fullWidth / 2 - (bounds.x + bounds.width / 2) * scale,
                fullHeight / 2 - (bounds.y + bounds.height / 2) * scale
            ];

            svg.transition().duration(350).call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale)
            );
        }

        // Spacebar zoom functionality
        document.addEventListener("keydown", function(event) {
            if (event.code === "Space") {
                event.preventDefault(); // Prevent page scroll

                if (!isZoomedIn && hoveredNode) {
                    previousTransform = d3.zoomTransform(svg.node()); // Save current zoom
                    zoomToNode(hoveredNode);
                    isZoomedIn = true;
                } else if (isZoomedIn && previousTransform) {
                    svg.transition().duration(350).call(zoom.transform, previousTransform);
                    isZoomedIn = false;
                    previousTransform = null;
                }
            }
        });

        // Mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Create simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(linksWithTiming).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-40))
            .force("x", d3.forceX(width / 2).strength(0.004))
            .force("y", d3.forceY(height / 2).strength(0.004));

        // Create links
        const link = zoomGroup.append("g")
            .selectAll("line")
            .data(linksWithTiming)
            .enter().append("line")
            .attr("class", "link")
            .style("opacity", 0);

        // Create nodes with platform-optimized animations
        const node = zoomGroup.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .style("opacity", 0)
            .on("mouseover", function(event, d) {
                hoveredNode = d;
            })
            .on("mouseout", function(event, d) {
                hoveredNode = null;
            })
            .on("click", function(event, d) {
                handleNodeClick(d);
            })
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        // Add blur filters based on platform
        if (isMobile) {
            // Use CSS blur for mobile (better performance)
            node.style("filter", "blur(10px)");
        } else {
            // Use SVG filters for desktop (original beam.js approach)
            node.each(function(d, i) {
                const nodeDefs = defs.append("filter")
                    .attr("id", `blurFilter-${i}`);
                
                const nodeBlur = nodeDefs.append("feGaussianBlur")
                    .attr("in", "SourceGraphic")
                    .attr("stdDeviation", 10)
                    .attr("result", "blur");
                
                nodeDefs.append("feComponentTransfer")
                    .append("feFuncA")
                    .attr("type", "linear")
                    .attr("slope", 1);
                
                // Apply the individual filter to this node
                d3.select(this).style("filter", `url(#blurFilter-${i})`);
                
                // Store the blur element reference for later animation
                d3.select(this).datum().blurElement = nodeBlur;
            });
        }

        // Preload all images before starting animations
        const imagePromises = nodes.map(nodeData => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(nodeData.id);
                img.onerror = () => reject(nodeData.id);
                img.src = nodeData.icon;
            });
        });

        // Wait for all images to load, then start animations
        Promise.all(imagePromises)
            .then(() => {
                console.log("All images loaded, starting platform-optimized animations");
                
                // Animate nodes one by one with platform-specific transitions
                nodes.forEach((nodeData, index) => {
                    const nodeElement = node.filter(d => d.id === nodeData.id);
                    
                    if (isMobile) {
                        // Mobile: Use CSS blur animation
                        nodeElement.transition()
                            .delay(500 + (index * 500)) // 500ms stagger delay
                            .duration(1500) // Slower duration like beam.js
                            .style("opacity", 1)
                            .styleTween("filter", function() {
                                const i = d3.interpolateNumber(10, 0);
                                return function(t) {
                                    return `blur(${i(t)}px)`;
                                };
                            })
                            .on("end", function() {
                                // Remove the filter after animation completes
                                d3.select(this).style("filter", null);
                            });
                    } else {
                        // Desktop: Use SVG filter animation (original beam.js approach)
                        if (nodeData.blurElement) {
                            nodeData.blurElement.transition()
                                .delay(500 + (index * 500)) // 500ms stagger delay
                                .duration(1500) // Slower duration like beam.js
                                .attrTween("stdDeviation", function () {
                                    const i = d3.interpolateNumber(10, 0);
                                    return function (t) {
                                        return i(t);
                                    };
                                })
                                .on("end", function() {
                                    // Remove the filter from this node when animation completes
                                    nodeElement.style("filter", null);
                                });
                        }
                        
                        nodeElement.transition()
                            .delay(500 + (index * 500)) // 500ms stagger delay
                            .duration(1500) // Slower duration like beam.js
                            .style("opacity", 1);
                    }
                });

                // Animate links one by one based on timing
                linksWithTiming.forEach((linkData, index) => {
                    const linkElement = link.filter(d => 
                        d.source === linkData.source && d.target === linkData.target
                    );
                    
                    linkElement.transition()
                        .delay(500 + (linkData.timingIndex * 500)) // Use timing index with 500ms delay
                        .duration(1000)
                        .style("opacity", 1);
                });
            })
            .catch(error => {
                console.error("Some images failed to load:", error);
                // Start animations anyway if some images fail
                nodes.forEach((nodeData, index) => {
                    const nodeElement = node.filter(d => d.id === nodeData.id);
                    
                    if (isMobile) {
                        // Mobile: Use CSS blur animation
                        nodeElement.transition()
                            .delay(500 + (index * 500)) // 500ms stagger delay
                            .duration(1500) // Slower duration like beam.js
                            .style("opacity", 1)
                            .styleTween("filter", function() {
                                const i = d3.interpolateNumber(10, 0);
                                return function(t) {
                                    return `blur(${i(t)}px)`;
                                };
                            })
                            .on("end", function() {
                                // Remove the filter after animation completes
                                d3.select(this).style("filter", null);
                            });
                    } else {
                        // Desktop: Use SVG filter animation (original beam.js approach)
                        if (nodeData.blurElement) {
                            nodeData.blurElement.transition()
                                .delay(500 + (index * 500)) // 500ms stagger delay
                                .duration(1500) // Slower duration like beam.js
                                .attrTween("stdDeviation", function () {
                                    const i = d3.interpolateNumber(10, 0);
                                    return function (t) {
                                        return i(t);
                                    };
                                })
                                .on("end", function() {
                                    // Remove the filter from this node when animation completes
                                    nodeElement.style("filter", null);
                                });
                        }
                        
                        nodeElement.transition()
                            .delay(500 + (index * 500)) // 500ms stagger delay
                            .duration(1500) // Slower duration like beam.js
                            .style("opacity", 1);
                    }
                });

                linksWithTiming.forEach((linkData, index) => {
                    const linkElement = link.filter(d => 
                        d.source === linkData.source && d.target === linkData.target
                    );
                    
                    linkElement.transition()
                        .delay(500 + (linkData.timingIndex * 500)) // Use timing index with 500ms delay
                        .duration(1000)
                        .style("opacity", 1);
                });
            });

        node.append("image")
            .attr("xlink:href", d => d.icon)
            .attr("x", -imageSizeHalf)
            .attr("y", -imageSizeHalf)
            .attr("width", imageSize)
            .attr("height", imageSize);

        // Simulation tick function
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

  // Your visualization code here
  console.log("Initializing visualization with:", graphData);
}

// Load the data when the script runs
getData();