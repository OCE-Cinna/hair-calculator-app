const loader = new OBJLoader();
const object = await loader.loadAsync('models/monster.obj');
scene.add(object);