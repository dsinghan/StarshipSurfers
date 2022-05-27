import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Textured_Phong} = defs;

export class Assignment extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.num_iterations = 997;

        this.rand_values = Array.from({length: this.num_iterations}, () => (Math.floor(Math.random() * 3)));

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            // torus2: new defs.Torus(3, 15),
            // sphere: new defs.Subdivision_Sphere(4),
            // circle: new defs.Regular_2D_Polygon(1, 15),
            starship: new defs.Cube(),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            // test2: new Material(new Gouraud_Shader(),
            //     {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            // ring: new Material(new Ring_Shader()),
            starship: new Material(new Textured_Phong(),
                {ambient: .5, 
                 diffusivity: .1,
                 specularity: .1,
                 color: hex_color("#ffffff"),
                 texture: new Texture("assets/stars.png")
                }),
        }

        this.get_y_offset = (y_offset, i) => {
            return y_offset * i;
        }

        this.get_z_offset = (z_offset, i) => {
            return z_offset * (i-1);
        }

        this.get_object_speed = (fall_constant, t, i, mul) => {
            return t * fall_constant * this.rand_values[this.num_iterations % (i*mul)];
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.x_offset = 0
        this.y_offset = -6
        this.z_offset = -20;
        this.z_fall = 100;

        // NEW GLOBAL VARIABLES
        // Starship variables
        this.starship_y_coord = -7;                 // starship y-coord from centre
        this.starship_x_coord = 0;                  // shifted depending on movement controls
        this.starship_x_movement = 3;               // how much move in x direction every press
        this.starship_z_coord = 0;
        this.obstacle_coord = [0];
        // set up arrays for obstacle collision and placement
        // theres one array for the actual 
        for (let i = 1; i < 901; i++) {
            this.obstacle_coord.push([this.x_offset, this.y_offset, this.z_offset*i]);
        }
        this.obstacle_collision_coord = [0];
        for (let i = 1; i < 901; i++) {
            this.obstacle_collision_coord.push([this.x_offset, this.y_offset, this.z_offset*i]);
        }
        this.random_x_assignment = [0];
        for (let i = 1; i < 901; i++) {
            let rand = Math.floor(Math.random() * 5)
            let x_coord;
            if (rand === 0) {
                x_coord = 0;
            } else if (rand === 1) {
                x_coord = -7;
            } else if (rand === 2) {
                x_coord = 7;
            } else if (rand === 3) {
                x_coord = -3.5;
            } else {
                x_coord = 3.5;
            }
            this.obstacle_coord[i][0] = x_coord;
            this.obstacle_collision_coord[i][0] = x_coord;
        }
    }

    touched(obstacle_coord, starship_coord) {
        let obs_x = obstacle_coord[0];
        let obs_y = obstacle_coord[1];
        let obs_z = obstacle_coord[2];
        let star_x = starship_coord[0];
        let star_y = starship_coord[1];
        let star_z = starship_coord[2];
        let threshhold = 2
        let z_threshhold_lower = 5
        let z_threshhold_upper = 1
        if ((star_x - threshhold <= obs_x && obs_x <= star_x + threshhold) && 
            (star_y - threshhold <= obs_y && obs_y <= star_y + threshhold) && 
            (star_z - z_threshhold_upper <= obs_z && obs_z <= star_z + z_threshhold_lower)) {
            return true;
        } else {
            return false;
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Left", ["Control", "a"], () => this.move_left = () => this.starship);
        this.key_triggered_button("Right", ["Control", "d"], () => this.move_right = () => this.starship);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];


        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");
        let model_transform = Mat4.identity();

        // *******************************
        // ********** NEW STUFF **********
        // *******************************

        // Variables

        // Starship Movement Controls
        if(this.move_left) {
            this.move_left = !this.move_left;
            this.starship_x_coord -= this.starship_x_movement;
        }
        if(this.move_right) {
            this.move_right = !this.move_right;
            this.starship_x_coord += this.starship_x_movement;
            // starship_transform = starship_transform.times(Mat4.translation(-3,0,0));
        }

        // ***** DRAW STARSHIP *****
        let starship_transform = Mat4.identity();
        // move starship to correct y-coord and scale to make it a rectangle
        starship_transform = starship_transform.times(Mat4.translation(this.starship_x_coord,this.starship_y_coord, 2))
                                                .times(Mat4.scale(1.2,1,3));
        
        this.shapes.starship.draw(context, program_state, starship_transform, this.materials.starship);

        for (let i = 1; i < 901; i++) {
            this.shapes.torus.draw(context, program_state, model_transform.times(Mat4.translation(this.obstacle_coord[i][0], this.obstacle_coord[i][1], this.obstacle_coord[i][2] + this.z_fall * t)), this.materials.test.override({color: yellow}));
            this.obstacle_collision_coord[i] = [this.obstacle_collision_coord[i][0], this.obstacle_collision_coord[i][1], this.z_offset * i + this.z_fall * t];
            if (this.touched(this.obstacle_collision_coord[i], [this.starship_x_coord, this.starship_y_coord, this.starship_z_coord])) {
                // put your collision function here
                this.shapes.starship.draw(context, program_state, starship_transform.times(Mat4.translation(0, 0, -5)), this.materials.starship);
            }
        }
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

