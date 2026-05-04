const manager = new THREE.LoadingManager();
manager.onLoad = () => console.log('Loading complete!');
const loader1 = new OBJLoader(manager);
const loader2 = new ColladaLoader(manager);

