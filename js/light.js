var LI = {};
(function(global){

var LI = global.LI;
var lightPos = LI.lightPos;

// for sponza
var lightPosMin = [-1250, 0, -600];
var lightPosMax = [1250, 800, 600];

/*var lightPosMin = [-14, -0.5, -6];
var lightPosMax = [14, 18, 6];*/

var lightVelY = -20;
var LIGHT_RADIUS = 4;
var NUM_LIGHTS = LI.NUM_LIGHTS;
var TILE_SIZE = LI.TILE_SIZE;

var lightPosition = LI.position = null;
var lightColorRadius = LI.colorRadius = null;
var buffer = null;

var totalTilesX = LI.totalTilesX = 0;
var totalTilesY = LI.totalTilesY = 0;

var quadPositionBuffer;
var quadPositions = new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    1.0,  1.0,
    1.0,  1.0,
    -1.0,  1.0,
    -1.0, -1.0
]);


LI.init = function (numTiles, numLights, lightRadius) {
    NUM_LIGHTS = LI.NUM_LIGHTS = numLights;
    TILE_SIZE = LI.TILE_SIZE = numTiles;
    LIGHT_RADIUS = lightRadius;

    lightPosition = LI.position = new Float32Array(NUM_LIGHTS * 3);
    lightColorRadius = LI.colorRadius = new Float32Array(NUM_LIGHTS * 4)

    totalTilesX = LI.totalTilesX = Math.ceil(window.innerWidth/TILE_SIZE);
    totalTilesY = Math.ceil(window.innerHeight/TILE_SIZE);
    LI.totalTiles = totalTiles = totalTilesX * totalTilesY;

    for (var i = 0; i < NUM_LIGHTS*3; i+=3) {

        // pos
        LI.position[i] = Math.random() * (lightPosMax[0] - lightPosMin[0]) + lightPosMin[0];
        LI.position[i + 1] = Math.random() * (lightPosMax[1] - lightPosMin[1]) + lightPosMin[1];
        LI.position[i + 2] = Math.random() * (lightPosMax[2] - lightPosMin[2]) + lightPosMin[2];
        
    }

    for (var i = 0; i < NUM_LIGHTS*4; i+=4) {
        LI.colorRadius[i] = Math.random();
        LI.colorRadius[i + 1] = Math.random();
        LI.colorRadius[i + 2] = Math.random();
        LI.colorRadius[i + 3] = LIGHT_RADIUS;
    }

    buffer = gl.createBuffer();
    var lightPositionTexture = LI.positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightPositionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT, lightPosition);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    var lightColorTexture = LI.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightColorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NUM_LIGHTS, 1, 0, gl.RGBA, gl.FLOAT, LI.colorRadius);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    var lightCulled = LI.lightCulled = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightCulled);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(window.innerWidth * window.innerHeight * 4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    var lightCulledFrameBuffer = LI.lightCulledFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, LI.lightCulledFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightCulled, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    quadPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

LI.update = function (dt) {
    var b;
    for (var i = 0; i < NUM_LIGHTS; i++) {

        var mn = lightPosMin[1];
        var mx = lightPosMax[1];
        LI.position[(i * 3) + 1] = (LI.position[(i * 3) + 1] + (lightVelY * dt));
        if(LI.position[(i * 3) + 1] < mn)
            LI.position[(i * 3) + 1] = mx;
    }

    gl.bindTexture(gl.TEXTURE_2D, LI.positionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT, lightPosition);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

LI.light_debug = function(camera) {
    var shader = gl.shaders["light_debug"];
    shader.uniforms({u_mvp: camera._viewprojection_matrix});
    
    gl.useProgram(shader.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, LI.position, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(gl.getAttribLocation(shader.program, 'a_vertex'));
    gl.vertexAttribPointer(gl.getAttribLocation(shader.program, 'a_vertex'), 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, LI.NUM_LIGHTS);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

LI.lightCulling = function(camera, render){
    var shader = gl.shaders["light_culling"];
    var inv = mat4.create();
    mat4.invert(inv, camera._viewprojection_matrix);
    var pixel1 = vec4.fromValues(-1,-1, 1, 1);
    var pixel2 = vec4.fromValues(-1,-0.96, 1, 1);
    var pixel3 = vec4.fromValues(-0.96,-1, 1, 1);
    var pixel4 = vec4.fromValues(-0.96,-0.96, 1, 1);

    var res1 = res2 = res3 = res4 = vec4.create();
    vec4.transformMat4(res1, pixel1, inv);
    res1 = vec3.fromValues(res1[0]/res1[3], res1[1]/res1[3], res1[2]/res1[3]);
    vec4.transformMat4(res2, pixel2, inv);
    res2 = vec3.fromValues(res2[0]/res2[3], res2[1]/res2[3], res2[2]/res2[3]);
    vec4.transformMat4(res3, pixel3, inv);
    res3 = vec3.fromValues(res3[0]/res3[3], res3[1]/res3[3], res3[2]/res3[3]);
    vec4.transformMat4(res4, pixel4, inv);
    res4 = vec3.fromValues(res4[0]/res4[3], res4[1]/res4[3], res4[2]/res4[3]);
    var cross = plane = vec3.create();
    var aux = vec3.fromValues(res2[0] - camera._position[0],res2[1] - camera._position[1], res2[2] - camera._position[2]);
    var aux2= vec3.fromValues(res1[0] - camera._position[0],res1[1] - camera._position[1], res1[2] - camera._position[2]);
    vec3.cross(cross, aux, aux2);
    vec3.normalize(plane, cross);
    var distance = vec3.dot(plane, camera._position);

    //console.log("camera " +camera._position);

    gl.useProgram(shader.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, LI.positionTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, LI.positionTexture);

    shader.uniforms({
        u_numLights : LI.NUM_LIGHTS,
        u_tileSize : LI.TILE_SIZE,
        u_screenWidth : window.innerWidth,
        u_screenHeight : window.innerHeight,
        u_invViewProjMatrix : inv,
        u_lights : 0,
        u_lightsRadius : 1,
        u_camera_position : camera._position
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);

    gl.enableVertexAttribArray(gl.getAttribLocation(shader.program, 'a_vertex'));
    gl.vertexAttribPointer(gl.getAttribLocation(shader.program, 'a_vertex'), 2, gl.FLOAT, false, 0, 0);

    if(!render)
        gl.bindFramebuffer(gl.FRAMEBUFFER, LI.lightCulledFrameBuffer);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if(!render)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


})( typeof(window) != "undefined" ? window : (typeof(self) != "undefined" ? self : global ) );

