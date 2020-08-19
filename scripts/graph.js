/*
This module handles graph vertices, edges, and paths.
*/

class Vertex {
    constructor(id, x, y){
        this.id = id;
        this.x = x;
        this.y = y;

        this.neighborIds = [];
        this.labels = [];
    }

    isAdjTo(id){
        // binary search
        let min = 0;
        let max = this.neighborIds.length;
        let mid = parseInt((min + max) / 2);
        let isAdj = false;
        while(!isAdj && min < max){
            if(this.neighborIds[mid] < id){
                min = mid + 1;
            } else if(this.neighborIds[mid] > id){
                max = mid - 1;
            } else {
                isAdj = true;
            }
            mid = parseInt((min + max) / 2);
        }
        return isAdj;
    }

    addNeighbor(neighborId){
        if(!this.isAdjTo(neighborId)){
            // perform insertion sort
            let insertIdx = this.neighborIds.length;
            let temp;
            this.neighborIds.push(neighborId);
            while(insertIdx > 0 && this.neighborIds[insertIdx - 1] > neighborId){
                temp = this.neighborIds[insertIdx - 1];
                this.neighborIds[insertIdx - 1] = neighborId;
                this.neighborIds[insertIdx] = temp;
                insertIdx--;
            }
        }
    }

    distanceFrom(vertex2){
        return Math.sqrt(Math.pow(vertex2.x - this.x, 2), Math.pow(vertex2.y - this.y, 2));
    }

    toString(){
        return `#${this.id}(${this.x}, ${this.y})`;
    }

    /*
    Canvas is a canvas object
    from gui.js
    */
    draw(canvas){
        canvas.rect(this.x, this.y, 20, 20);
    }
}

class Edge {
    /*
    from and to are Vertex objects
    */
    constructor(from, to){
        this.from = from;
        this.to = to;
        this.length = from.distanceFrom(to);
    }

    toString(){
        return `Edge ${this.from.id} => ${this.to.id}`;
    }

    draw(canvas){
        canvas.line(this.from.x, this.from.y, this.to.x, this.to.y);
    }
}

class Path {
    constructor(){
        this.vertices = [];
        this.edges = [];
    }

    addVertex(vertex){
        if(this.vertices.length >= 1){
            // add edge from the current end of the vertex list to the new end
            this.edges.push(new Edge(this.vertices[this.vertices.length - 1], vertex));
        }
        this.vertices.push(vertex);
    }

    getVertices(){
        return this.vertices;
    }

    toString(){
        return "PATH: " + this.vertices.map((v)=>v.toString()).join(" => ");
    }

    draw(canvas){
        this.edges.forEach((edge)=>edge.draw(canvas));
    }
}

class Graph {
    constructor(){
        /*
        Vertex => Edge[]
        Key is start, value is the edges connecting it to its neighbors.
        */
        this.edges = new Map();
        this.idToVertex = new Map();
        this.labelToVertex = new Map();
        this.image = null;
        this.bounds = [0, 0];
    }

    addVertex(vertex){
        this.idToVertex.set(vertex.id, vertex);
        if(vertex.x > this.bounds[0]){
            this.bounds[0] = vertex.x;
        }
        if(vertex.y > this.bounds[1]){
            this.bounds[1] = vertex.y;
        }
    }
    addEdge(edge){
        if(!this.edges.has(edge.from)){
            this.edges.set(edge.from, []);
        }
        this.edges.get(edge.from).push(edge);
    }
    addLabel(labelStr, vertex){
        this.labelToVertex.set(labelStr, vertex);
    }
    setImage(path){
        this.image = new Image();
        this.image.src = path;
    }

    getBounds(){
        return this.bounds;
    }

    getAllLabels(){
        return Array.from(this.labelToVertex.keys());
    }

    /*
    Takes a CsvFile, and
    adds the vertices contained
    therein.
    */
    parseVertexCsv(csv){
        console.log("Parsing the following vertex file:");
        console.log(csv.toString());
        let errors = [];
        let idCol = csv.getColIdx("id");
        let xCol = csv.getColIdx("x");
        let yCol = csv.getColIdx("y");
        let data = csv.getBody();
        let row;
        let id;
        let x;
        let y;
        let errorFlag = false;
        for(let rowNum = 0; rowNum < data.length; rowNum++){
            errorFlag = false;
            row = data[rowNum];
            id = parseInt(row[idCol]);
            x = parseInt(row[xCol]);
            y = parseInt(row[yCol]);
            if(isNaN(id)){
                errors.push(`Invalid ID: ${row[idCol]}`);
                errorFlag = true;
            }
            if(isNaN(x)){
                errors.push(`Invalid X coordinate: ${row[xCol]}`);
                errorFlag = true;
            }
            if(isNaN(y)){
                errors.push(`Invalid Y coordinate: ${row[yCol]}`);
                errorFlag = true;
            }

            if(!errorFlag){
                this.addVertex(new Vertex(id, x, y));
            }
            errorFlag = false;
        }
        if(errors.length === 0){
            console.log("File parsed 100% successfully!");
        } else {
            console.error("Encountered a the following errors:");
            errors.forEach((e)=>console.error(e));
        }
    }

    parseEdgeCsv(csv){
        console.log("Parsing the following edge file:");
        console.log(csv.toString());
        let body = csv.getBody();
        let errors = [];
        let row;
        let id1;
        let id2;
        let vertex1;
        let vertex2;
        let errorFlag;
        for(let rowNum = 0; rowNum < body.length; rowNum++){
            errorFlag = false;
            row = body[rowNum];
            id1 = parseInt(row[0]);
            id2 = parseInt(row[1]);
            if(isNaN(id1)){
                errors.push(`Invalid ID in first column: ${row.toString()}`);
                errorFlag = true;
            }
            if(isNaN(id2)){
                errors.push(`Invalid ID in second column: ${row.toString()}`);
                errorFlag = true;
            }

            if(!errorFlag){
                // now see if I have the proper vertices
                vertex1 = this.idToVertex.get(id1);
                vertex2 = this.idToVertex.get(id2);
                if(vertex1 == null){
                    errors.push(`Graph contains no vertex with ID ${id1}`);
                    errorFlag = true;
                }
                if(vertex2 == null){
                    errors.push(`Graph contains no vertex with ID ${id2}`);
                    errorFlag = true;
                }
            }

            if(!errorFlag){
                // if we got here, we have 2 valid vertices
                this.addEdge(new Edge(vertex1, vertex2));
            }
        }

        if(errors.length === 0){
            console.log("File parsed 100% successfully!");
        } else {
            console.error("Encountered a the following errors:");
            errors.forEach((e)=>console.error(e));
        }
    }

    parseLabelCsv(csv){
        console.log("Parsing the following label file:");
        console.log(csv.toString());
        let body = csv.getBody();
        let errors = [];
        let labelCol = csv.getColIdx("label");
        let idCol = csv.getColIdx("id");
        let row;
        let label;
        let id;

        for(let rowNum = 0; rowNum < body.length; rowNum++){
            row = body[rowNum];
            label = row[labelCol].toString();
            id = parseInt(row[idCol]);
            if(isNaN(id)){
                errors.push(`Invalid id in row ${row.toString()}`);
            } else if(this.getVertexById(id) == null){
                errors.push(`Graph contains no vertex with ID ${id}`);
            } else {
                this.addLabel(label, this.getVertexById(id));
            }
        }


        if(errors.length === 0){
            console.log("File parsed 100% successfully!");
        } else {
            console.error("Encountered a the following errors:");
            errors.forEach((e)=>console.error(e));
        }
    }

    getVertexById(id){
        return this.idToVertex.get(id);
    }

    getVertexByLabel(label){
        return this.labelToVertex.get(label);
    }


    /*
    Dijkstra's algorithm
    */
    findPath(startId, endId){
        const DEBUG = true;

        // setup
        let path = new Path();
        let travelLog = []; // use an array as a stack
        let travelHeap = new PathStepMinHeap();
        let visited = new Map();
        let currVertex = this.getVertexById(startId);
        let currStep = new PathStep(new Edge(currVertex, currVertex), 0);

        // find the path
        travelLog.push(currStep);
        visited.set(currStep.edge.from.id, true);
        while(currVertex.id !== endId){
            // find every edge leading from currVertex...
            // ... add all edges to unvisited vertices to the travel heap
            this.edges.get(currVertex).filter((edge)=>!visited.has(edge.to.id)).forEach((edge)=>{
                // calculate the cost of the new step
                currStep = new PathStep(
                    edge,
                    travelLog[travelLog.length - 1].accumulatedDistance // add the accumulated distance from the top of the travelLog stack
                );
                travelHeap.siftUp(currStep); // add this step as an option to the travelHeap
            });

            if(DEBUG){
                console.log("After sifting up...");
                console.log(travelHeap.toString());
            }

            // find the best step
            do {
                currStep = travelHeap.siftDown();
            } while(visited.has(currStep.edge.to.id)); // ignore vertices we've already visited
            if(DEBUG){
                console.log("After sifting down...");
                console.log(travelHeap.toString());
            }

            // travel to this new best step
            travelLog.push(currStep);
            currVertex = currStep.edge.to;
            visited.set(currVertex.id, true);

            if(DEBUG){
                console.log("New travel log:");
                console.log(travelLog);
            }
        }

        // backtrack to construct the optimal path
        let accumulatedDistance = travelLog[travelLog.length - 1].accumulatedDistance; // the length the optimal path will have
        let reversed = [];
        while(travelLog.length !== 0 && currVertex.id !== startId){
            currStep = travelLog.pop();
            //                                    check for equality between floating point numbers
            if(currStep.edge.to === currVertex && Math.abs(currStep.accumulatedDistance - accumulatedDistance) < 0.001){
                // walk back
                reversed.push(currStep.edge.to);
                currVertex = currStep.edge.from;
                accumulatedDistance -= currStep.edge.from.distanceFrom(currStep.edge.to); // walked back this distance
            }
            if(DEBUG){
                console.log("After popping from the log:");
                console.log(reversed.toString());
            }
        }

        path.addVertex(this.getVertexById(startId));
        while(reversed.length !== 0){
            path.addVertex(reversed.pop());
        }
        return path;
    }

    prettyPrintGraphData(){
        console.log("GRAPH:");
        console.log("  IMAGE:");
        if(this.image == null){
            console.log("    no image set");
        } else {
            console.log("    " + this.image.src);
        }
        console.log("  VERTICES:");
        this.idToVertex.forEach((vertex, id)=>{
            console.log("    " + vertex.toString());
        });
        console.log("  EDGES:");
        this.edges.forEach((edgeArray, fromVertexId)=>{
            edgeArray.forEach((edge)=>console.log("    " + edge.toString()));
        });
        console.log("  LABELS:");
        //                     Map::forEach is backwards like this, right?
        this.labelToVertex.forEach((vertex, label)=>{
            console.log(`    ${label} => ${vertex.toString()}`);
        });
        console.log("END OF GRAPH");
    }

    draw(canvas){
        if(this.image != null){
            canvas.drawImage(this.image);
        }
        this.idToVertex.forEach((vertex, id)=>vertex.draw(canvas));
    }
}

class PathStep {
    constructor(edge, accumulatedDistance){
        this.edge = edge;
        this.accumulatedDistance = edge.length + accumulatedDistance;
    }

    toString(){
        return `Path Step on edge (${this.edge.toString()}). Total distance: ${this.accumulatedDistance}`;
    }
}
class PathStepMinHeap {
    constructor(){
        this.firstEmptyIdx = 0;
        this.values = [];
    }

    siftUp(pathStep){
        if(this.firstEmptyIdx === this.values.length){
            this.values.push(""); // make room for the new step
        }
        this.values[this.firstEmptyIdx] = pathStep;
        this.firstEmptyIdx++;

        // swap until the pathStep is in its proper place
        let currIdx = this.firstEmptyIdx - 1; // where the pathStep currently is
        let parentIdx = Math.floor((currIdx - 1) / 2); // starts at the bottom, so we need the node above it.
        // heaps are like a binary tree, so this is how you access a node's parents
        let temp = null;
        while(parentIdx >= 0 && currIdx !== 0 && this.values[currIdx].accumulatedDistance < this.values[parentIdx].accumulatedDistance){
            temp = this.values[parentIdx];
            this.values[parentIdx] = this.values[currIdx];
            this.values[currIdx] = temp;
            temp = null;
            currIdx = parentIdx;
            parentIdx = Math.floor((currIdx - 1) / 2);
        }
    }

    siftDown(){
        if(this.isEmpty()){
            throw new Error("Nothing to sift down");
        }
        // remove topmost item from the heap ...
        let ret = this.values[0];
        // ... the last element becomes the first, overwriting the old one
        this.values[0] = this.values[this.firstEmptyIdx - 1];
        this.firstEmptyIdx--; // last element's slot is marked "up for grabs", and may be overwrittin, effectively deleting it

        // swap this new top into place
        let currIdx = 0;
        let left = 1; // heap is like a binary tree, so this is how you access children
        let right = 2;
        let temp = null;
        while(
            // test if the new top is heavier than either child.
            // check if left or right are (in range and lighter than the new top)
            ((left < this.firstEmptyIdx && this.values[left].accumulatedDistance < this.values[currIdx].accumulatedDistance)) ||
            ((right < this.firstEmptyIdx && this.values[right].accumulatedDistance < this.values[currIdx].accumulatedDistance))
        ) {
            // identify which child is lighter
            if(this.values[left].accumulatedDistance < this.values[right].accumulatedDistance){
                // swap top with its left child
                temp = this.values[left];
                this.values[left] = this.values[currIdx];
                this.values[currIdx] = temp;
                currIdx = left;
            } else {
                // swap top with its right child
                temp = this.values[right];
                this.values[right] = this.values[currIdx];
                this.values[currIdx] = temp;
                currIdx = right;
            }
            temp = null;
            left = currIdx * 2 + 1;
            right = currIdx * 2 + 2;
        }

        return ret;
    }

    isEmpty(){
        return this.firstEmptyIdx === 0;
    }

    toString(){
        let ret = "HEAP:";
        let rowNum = 0;
        let colNum = 0;
        let rowMaxWidth = 1;
        let nextRow = null;
        for(let i = 0; i < this.firstEmptyIdx; i++){
            if(nextRow === null){
                nextRow = `\nRow #${rowNum}: `;
            }
            nextRow += this.values[i].toString();
            colNum++;
            if(colNum >= rowMaxWidth){
                // done with row
                rowNum++;
                rowMaxWidth *= 2;
                colNum = 0;
                ret += nextRow;
                nextRow = null;
            } else {
                nextRow += " | ";
            }
        }

        // don't forget incomplete rows!
        if(nextRow !== null){
            ret += nextRow;
        }

        ret += "\nEND OF HEAP";
        return ret;
    }
}

export {
    Vertex,
    Path,
    Graph
};
