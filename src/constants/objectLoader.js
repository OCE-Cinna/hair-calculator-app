import * as THREE from 'three';

// Following this tutorial https://youtu.be/2jwqotdQmdQ?si=VJOJCkH98p_LX5Va&t=1218
const loader = new THREE.ObjectLoader();
const obj = await loader.loadAsync('/src/constants/model/project.json');
scene.add(obj);
// Alternatively, to parse a previously loaded JSON structure
const object = await loader.parseAsync(a_json_object);
scene.add(object);

export default function objectToScene() {
    return obj;
}