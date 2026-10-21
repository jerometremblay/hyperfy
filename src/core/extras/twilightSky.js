// Original empirical approximation; observations and source credits: docs/twilight-sky.md.
// Directions are unit world-space vectors, elevations in degrees, output linear RGB.
export const twilightSkyShader = /* glsl */ `
  vec2 getAntitwilightBounds(float depression) {
    // Lynch, Dearborn & Richtsmeier (2017), Table 2: blue-band top / belt top.
    float d = clamp(depression, 0.0, 5.0);
    if (d < 1.0) return mix(vec2(0.0, 25.0), vec2(2.0, 30.0), d);
    if (d < 2.0) return mix(vec2(2.0, 30.0), vec2(8.0, 40.0), d - 1.0);
    if (d < 3.0) return mix(vec2(8.0, 40.0), vec2(13.0, 50.0), d - 2.0);
    if (d < 4.0) return mix(vec2(13.0, 50.0), vec2(25.0, 60.0), d - 3.0);
    return mix(vec2(25.0, 60.0), vec2(35.0, 80.0), d - 4.0);
  }

  vec3 getTwilightSky(vec3 direction, vec3 sunDirection, float sunAltitude) {
    float altitude = degrees(asin(clamp(direction.y, 0.0, 1.0)));
    float depression = max(0.0, -sunAltitude);
    // Horizontal dot times cos(view elevation): no azimuth seam or zenith singularity.
    vec2 solarAzimuth = sunDirection.xz / max(length(sunDirection.xz), 0.0001);
    float solarFacing = clamp(dot(direction.xz, solarAzimuth), -1.0, 1.0);
    float sunward = pow(0.5 + 0.5 * solarFacing, 2.0);
    float antisolar = pow(max(0.0, -solarFacing), 2.0);
    float horizon = exp(-altitude / 18.0);
    float night = 1.0 - smoothstep(-18.0, -6.0, sunAltitude);
    float shallow = smoothstep(-1.0, 0.5, depression) * (1.0 - smoothstep(3.0, 6.0, depression));
    vec2 bounds = getAntitwilightBounds(depression);
    float shadow = (1.0 - smoothstep(bounds.x - 3.0, bounds.x + 3.0, altitude))
      * smoothstep(0.0, 1.0, depression) * antisolar * shallow;
    float beltPosition = clamp((altitude - bounds.x) / (bounds.y - bounds.x), 0.0, 1.0);
    float belt = pow(sin(beltPosition * 3.14159265359), 2.0) * antisolar * shallow;

    // Display-scaled diffuse fill stands in for multiple scattering and blue-hour ozone.
    vec3 sky = mix(vec3(0.018, 0.030, 0.070), vec3(0.030, 0.045, 0.080), horizon);
    sky *= 1.0 - 0.5 * shadow;
    sky += vec3(0.040, 0.013, 0.018) * belt;

    // Broad twilight arch contracts toward the solar horizon as twilight deepens.
    float glowHeight = mix(28.0, 4.0, smoothstep(0.0, 15.0, depression));
    float glow = sunward * exp(-altitude / glowHeight)
      * exp(-0.55 * max(0.0, depression - 3.0));
    sky += vec3(0.42, 0.18, 0.055) * glow;
    float purpleHeight = mix(24.0, 10.0, smoothstep(2.0, 6.0, depression));
    float purple = smoothstep(2.0, 4.0, depression) * (1.0 - smoothstep(4.0, 6.0, depression))
      * pow(sunward, 3.0) * exp(-pow((altitude - purpleHeight) / 8.0, 2.0));
    sky += vec3(0.065, 0.014, 0.045) * purple;
    // One shared floor and fade, also used for diffuse celestial contrast.
    return vec3(0.0015, 0.002, 0.006) + sky * (1.0 - night);
  }
`
