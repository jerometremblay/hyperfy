# Node

The base class for all other nodes.

## Properties

### `.id`: String

The ID of the node. This is auto generated when creating nodes via script. For GLTF models converted to nodes, it uses the same object name you would see in blender.

NOTE: Blender GLTF exporter does rename objects in some cases, eg by removing spaces. Best practice is to simply name everything in UpperCamelCase with no other characters.

### `.position`: Vector3

The local position of the node.

### `.quaternion`: Quaternion

The local quaternion rotation of the node. Updating this automatically updates the `rotation` property.

### `.rotation`: Euler

The local euler rotation of the node. Updating this automatically updates the `quaternion` property.

### `.scale`: Vector3

The local scale of the node.

### `.matrixWorld`: Matrix4

The world matrix of this node in global space.

### `.parent`: Node

The parent node, if any.

### `.children`: [Node]

The child nodes.

### `.cameraOcclusion`: Boolean | null

Controls temporary clipping in isometric and retro orthographic views. The default
`null` lets opaque geometry that obstructs the local avatar trigger a cut of its
entire owning `.hyp` app, including script-created world nodes and separate apps
whose geometry bounds fit inside it. A horizontal plane 25 cm above the avatar's
standing height removes geometry above it while retaining lower walls and floors.
Set `true` to let transparent geometry trigger the cut too. Set `false` to exempt
a node and its subtree; `app.cameraOcclusion = false` exempts the entire app.

This changes only the local main-camera draw; physics and node activation remain
intact. Other instances outside the app's bounds remain complete.
GLB mesh and group custom properties use the same `cameraOcclusion` name.

## Methods

### `.add(otherNode)`: Self

Adds `otherNode` as a child of this node.

### `.remove(otherNode)`: Self

Removes `otherNode` if it is a child of this node.

### `.traverse(callback)`

Traverses this and all descendents calling `callback` with the node in the first argument.





