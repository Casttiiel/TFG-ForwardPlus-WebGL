var DF = {};
(function(global){

var DF = global.DF;

DF.init = function () {
    var g_buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, g_buffer);

    gl.activeTexture(gl.TEXTURE0);

    var positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTexture, 0);

    var normalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTexture, 0);

    var uvTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, uvTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, uvTexture, 0);

    var depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, window.innerWidth, window.innerHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

    //gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1,gl.COLOR_ATTACHMENT2]);



    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

DF.update = function (dt) {
    var b;
    var vector = resul = vec3.create();
    for (var i = 0; i < NUM_LIGHTS; i++) {

        var mn = lightPosMin[1];
        var mx = lightPosMax[1];
        LI.position[(i * 3) + 1] = (LI.position[(i * 3) + 1] + (lightVelY * dt));
        
        vector = vec3.fromValues(LI.position[i*3], LI.position[i*3 + 1], LI.position[i*3 + 2]);
        vec3.rotateY(resul, vector,0.25*dt);

        LI.position[(i * 3)] = resul[0];
        LI.position[(i * 3) + 1] = resul[1];
        LI.position[(i * 3) + 2] = resul[2];

        if(LI.position[(i * 3) + 1] < mn)
            LI.position[(i * 3) + 1] = mx;
    }

    gl.bindTexture(gl.TEXTURE_2D, LI.positionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, NUM_LIGHTS, 1, 0, gl.RGB, gl.FLOAT, lightPosition);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

})( typeof(window) != "undefined" ? window : (typeof(self) != "undefined" ? self : global ) );
