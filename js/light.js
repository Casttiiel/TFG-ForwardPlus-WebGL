var LI = {};
(function(global){

var LI = global.LI;
var lightPos = LI.lightPos;

/*var lightPosMin = [-14, -0.5, -6];
var lightPosMax = [14, 18, 6];*/

var LIGHT_RADIUS = 0;
var NUM_LIGHTS = LI.NUM_LIGHTS;
var TILE_SIZE = LI.TILE_SIZE;

var lightPosition = LI.position = null;
var lightColorTexture = LI.lightColorTexture = null;
var lightColor = LI.lightColor = null;
var buffer = quad = null;


LI.init = function (tileSize, lightRadius) {
    NUM_LIGHTS = LI.NUM_LIGHTS = numLights = 64;
    TILE_SIZE = LI.TILE_SIZE = tileSize;
    LIGHT_RADIUS = LI.LIGHT_RADIUS = lightRadius;

    lightPosition = LI.position = new Float32Array(NUM_LIGHTS * 3);

    //Position lights
    for(var i = 0; i < 52; i++){
        // pos
        if(i < 26){
            LI.position[i*3] = -322+Math.floor(i/2)*50;
            LI.position[i*3 + 1] = 10 ;
            LI.position[i*3 + 2] = -245+i%2*50;
        }else{
            LI.position[i*3] = -322+Math.floor((i-26)/2)*50;
            LI.position[i*3 + 1] = 10;
            LI.position[i*3 + 2] = 7.5+i%2*50;
        }
    }

    for(var i = 52; i < numLights; i++){
        // pos
        LI.position[i*3] = Math.random() * 600 - 300;
        LI.position[i*3 + 1] = Math.random() * 150;
        LI.position[i*3 + 2] = Math.random() * 450 - 300;
    }    

    lightColor = LI.lightColor = new Float32Array(NUM_LIGHTS * 3);
    for(var i = 0; i < numLights; i++){
        // pos
        LI.lightColor[i*3] = Math.random();
        LI.lightColor[i*3 + 1] = Math.random();
        LI.lightColor[i*3 + 2] = Math.random();
    }

    //create texture to store light positions
    buffer = gl.createBuffer();
    var lightPositionTexture = LI.positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightPositionTexture);
    if(gl.webgl_version == 2)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT , lightPosition);
    else
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT , lightPosition);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //create texture to store light colors
    LI.lightColorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, LI.lightColorTexture);
    if(gl.webgl_version == 2)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT , LI.lightColor);
    else
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT , LI.lightColor);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //create texture to store index of lights to iterate for each tile
    var lightCulled = LI.lightCulled = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, LI.lightCulled);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //create framebuffer and bind texture so we actually fill the light culled texture
    var lightCulledFrameBuffer = LI.lightCulledFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, LI.lightCulledFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, LI.lightCulled, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    quad = GL.Mesh.getScreenQuad();

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
    
    gl.useProgram(shader.program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, LI.positionTexture);

    var inv1 = inv2 = mat4.create();
    mat4.invert(inv1, camera._projection_matrix);
    mat4.invert(inv2, camera._view_matrix);

    shader.uniforms({
        u_numLights : LI.NUM_LIGHTS,
        u_tileSize : LI.TILE_SIZE,
        u_screenWidth : window.innerWidth,
        u_screenHeight : window.innerHeight,
        u_invViewProjMatrix : inv,
        u_lights : 0,
        u_lightRadius : LI.LIGHT_RADIUS,
        u_camera_position : camera._position
    });

    //using the light culling shader with its proper uniforms, if bind the framebuffer will write into texture, if not into screen

    if(!render)
        gl.bindFramebuffer(gl.FRAMEBUFFER, LI.lightCulledFrameBuffer);

    shader.draw(quad);

    if(!render)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

LI.lightCullingHeatMap = function(camera){
    var shader = gl.shaders["light_culling_heat_map_"+LI.TILE_SIZE];
    var inv = mat4.create();
    mat4.invert(inv, camera._viewprojection_matrix);
    
    gl.useProgram(shader.program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, LI.lightCulled);

    var inv1 = inv2 = mat4.create();
    mat4.invert(inv1, camera._projection_matrix);
    mat4.invert(inv2, camera._view_matrix);
    shader.uniforms({
        u_numLights : LI.NUM_LIGHTS,
        u_tileSize : LI.TILE_SIZE,
        u_screenWidth : window.innerWidth,
        u_screenHeight : window.innerHeight,
        u_invViewProjMatrix : inv,
        u_lightCulled : 0,
        u_camera_position : camera._position,
        u_projectionMatrix : inv1,
        u_viewMatrix : inv2
    });

    //using proper shader with its uniforms, no need to write into texture, is for debug
    shader.draw(quad);

}


})( typeof(window) != "undefined" ? window : (typeof(self) != "undefined" ? self : global ) );

