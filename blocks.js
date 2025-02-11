  // 基本設定
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // カメラの位置を調整
  camera.position.z = 600;

  // 背景色を設定
  scene.background = new THREE.Color(0xf0f0f0);

  // キューブを格納する配列
  const cubes = [];
  
  // 地面の高さを定義
  const groundHeight = -window.innerHeight / 2;

  // 削除中かどうかを管理するフラグ
  let isDeleting = false;

  // 指定時間待機する関数（非同期）
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ランダムな色を生成する関数
  function getRandomColor() {
    const colors = [0x3D8D7A, 0xB3D8A8, 0xFBFFE4, 0xA3D1C6];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ランダムなキューブを作成する関数
  function createCube() {
    if (isDeleting) return; // 削除中は新しいキューブを作成しない

    const size = 80; // キューブのサイズ
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color: getRandomColor(),
      transparent: true,
      opacity: 0.75,
    });
    const cube = new THREE.Mesh(geometry, material);

    // 初期位置（画面上部からランダムなX座標）
    cube.position.x = (Math.random() - 0.5) * window.innerWidth;
    cube.position.y = window.innerHeight / 2;

    cube.userData = { velocityY: -2, size, isStatic: false };

    if (cubes.length >= 100) {
      console.log("キューブが100個に達しました。処理を終了します。");
      return;
    }

    cubes.push(cube);
    scene.add(cube);
  }

  // アニメーションループ
  function animate() {
    requestAnimationFrame(animate);

    cubes.forEach(cube => {
      if (!cube.userData.isStatic) {
        cube.userData.velocityY -= 0.1; // 重力効果
        cube.position.y += cube.userData.velocityY;

        // 地面または他のキューブに衝突した場合
        if (cube.position.y - cube.userData.size <= groundHeight || checkCollision(cube)) {
          cube.position.y = Math.max(
            groundHeight + cube.userData.size,
            getHighestCubeY(cube) + cube.userData.size
          );
          cube.userData.isStatic = true; // 静的状態に設定
          cube.userData.velocityY = 0;   // 落下停止
        }
      }
    });

    renderer.render(scene, camera);
  }

  // 他のキューブとの衝突をチェックする関数
  function checkCollision(cube) {
    return cubes.some(other => 
      other !== cube &&
      other.userData.isStatic &&
      Math.abs(cube.position.x - other.position.x) < cube.userData.size &&
      Math.abs(cube.position.y - other.position.y) < (cube.userData.size + other.userData.size) / 2
    );
  }

  // 最も高いキューブのY座標を取得する関数
  function getHighestCubeY(cube) {
    return cubes.reduce((highestY, other) => 
      other !== cube && other.userData.isStatic && Math.abs(cube.position.x - other.position.x) < cube.userData.size 
        ? Math.max(highestY, other.position.y)
        : highestY,
      groundHeight
    );
  }

   // **右クリックでキューブをすべて削除**
   document.addEventListener('contextmenu', async (event) => {
     event.preventDefault(); 
     isDeleting = true; 

     let pos = 0;

     while (cubes.length > 0) {
       const cube = cubes.shift(); 

       setTimeout(() => {
         const fallInterval = setInterval(() => {
           cube.position.y -= 10; 
           cube.rotation.x += 0.1; 
           cube.rotation.y += 0.1; 

           if (cube.position.y < -window.innerHeight / 2 - cube.userData.size) {
             clearInterval(fallInterval); 
             scene.remove(cube); 

             if (cubes.length === 0) {
               console.log("すべてのキューブが削除されました。");
               sleep(1000).then(() => { isDeleting = false; });
             }
           }
         },16);
       }, pos * 50); 
       pos++;
     }
   });

// キューブを整列させる関数
function alignCubes() {
  if (cubes.length === 0) {
    return;
  }

  const size = cubes[0].userData.size;
  const cubesPerRow = Math.floor(window.innerWidth / (size * 1.25));
  let xOffset = -Math.floor(window.innerWidth / 2);
  let yOffset = groundHeight + size / 2;
  let currentRow = 0;
  let currentCol = 0;

  cubes.forEach((cube, index) => {
    // 整列後の位置を計算
    const targetX = xOffset + currentCol * size * 1.25;
    const targetY = yOffset + currentRow * size;

    // キューブを小さくして消えるアニメーション
    const shrinkInterval = setInterval(() => {
      cube.scale.x -= 0.1;
      cube.scale.y -= 0.1;
      cube.scale.z -= 0.1;

      if (cube.scale.x <= 0) {
        clearInterval(shrinkInterval);

        // キューブを整列位置に移動
        cube.position.x = targetX;
        cube.position.y = targetY;

        // キューブを大きくして現れるアニメーション
        const growInterval = setInterval(() => {
          cube.scale.x += 0.1;
          cube.scale.y += 0.1;
          cube.scale.z += 0.1;

          if (cube.scale.x >= 1) {
            clearInterval(growInterval);
            cube.userData.isStatic = true; // 静的なオブジェクトとして扱う
            cube.userData.velocityY = 0;   // 落下を停止
          }
        }, 16); // アニメーション間隔（約60FPS）
      }
    }, 16); // アニメーション間隔（約60FPS）

    currentCol++;
    if (currentCol > cubesPerRow) {
      currentCol = 0;
      currentRow++;
    }
  });
}


  // キューブを定期的に生成
 const cubeGenerationInterval = setInterval(createCube, 1200);

  // クリックイベントを追加
  document.addEventListener('click', alignCubes);

   animate();
