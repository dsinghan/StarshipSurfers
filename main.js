import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong, Phong_Shader, Subdivision_Sphere} = defs

import {Color_Phong_Shader, Shadow_Textured_Phong_Shader, Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './shadow-demo-shaders.js'

// 2D shape, to display the texture buffer
const Square =
    class Square extends tiny.Vertex_Buffer {
        constructor() {
            super("position", "normal", "texture_coord");
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0),
                vec3(1, 1, 0), vec3(1, 0, 0), vec3(0, 1, 0)
            ];
            this.arrays.normal = [
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
            ];
            this.arrays.texture_coord = [
                vec(0, 0), vec(1, 0), vec(0, 1),
                vec(1, 1), vec(1, 0), vec(0, 1)
            ]
        }
    }


export class Assignment extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.num_iterations = 997;

        this.rand_values = Array.from({length: this.num_iterations}, () => (Math.floor(Math.random() * 3)));

        // *** Shapes
        this.shapes = {
            torus: new defs.Torus(15, 15),
            starship: new defs.Cube(),
            starship_wheel: new defs.Torus(4, 15),
            axel: new defs.Capped_Cylinder(100, 20),
            flag: new defs.Rounded_Closed_Cone(10, 10),
            background: new defs.Square,
            sphere: new Subdivision_Sphere(6),
            square_2d: new Square(),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            obstacle: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: 0.9, 
                    diffusivity: .1,
                    specularity: .1,
                    color: hex_color("#FFFFFF"),
                    light_depth_texture: null
                }),
            starship: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: 0.9, 
                    diffusivity: .1,
                    specularity: .1,
                    color: hex_color("#FFFFFF"),
                    light_depth_texture: null
                    // texture: new Texture("assets/stars.png")
                }),
            wheel: new Material(new Shadow_Textured_Phong_Shader(1),
                {
                    ambient: .2, 
                    diffusivity: .1,
                    specularity: .1,
                    color: hex_color("#ffffff"),
                    texture: new Texture("assets/tire_texture.jpg"),
                    light_depth_texture: null
                    // <a href="https://www.vecteezy.com/free-vector/tire-texture">Tire Texture Vectors by Vecteezy</a>
                }),
            axel: new Material(new Shadow_Textured_Phong_Shader(1),
               {
                    ambient: .5, 
                    diffusivity: .9,
                    specularity: .8,
                    color: hex_color("#C0C0C0"),
                    light_depth_texture: null
               }),
            flag_pole: new Material(new Shadow_Textured_Phong_Shader(1),
               {
                    ambient: .5, 
                    diffusivity: .9,
                    specularity: .8,
                    color: hex_color("#AAA9AD"),
                    light_depth_texture: null
               }),
            flag: new Material(new Shadow_Textured_Phong_Shader(1),
               {
                    ambient: 1, 
                    diffusivity: .1,
                    specularity: .1,
                    color: hex_color("#000000"),
                    texture: new Texture("assets/reflector.jpg", "NEAREST"),
                    light_depth_texture: null
                    // https://intamarket-graphics.co.za/product/t-7500-mvp-series/
               }),

            royce: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                // ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
                texture: new Texture("assets/royce.jpg"),
                light_depth_texture: null
            }),

            royce_floor: new Material(new Shadow_Textured_Phong_Shader(1), {
                color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
                // color: hex_color("#ffffff"), ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                color_texture: new Texture("assets/royce.jpg"),
                light_depth_texture: null
            }),
        }

        // For the floor or other plain objects
        this.floor = new Material(new Shadow_Textured_Phong_Shader(1), {
            color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
            color_texture: null,
            light_depth_texture: null
        })
        // For the first pass
        this.pure = new Material(new Color_Phong_Shader(), {
        })
        // For light source
        this.light_src = new Material(new Phong_Shader(), {
            color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
        });
        // For depth texture display
        this.depth_tex =  new Material(new Depth_Texture_Shader_2D(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null
        });

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
        this.z_fall = 10;

        // NEW GLOBAL VARIABLES
        // Starship variables
        this.starship_y_coord = -7;                 // starship y-coord from centre
        this.starship_x_coord = 0;                  // shifted depending on movement controls
        this.starship_x_movement = 5;               // how much move in x direction every press
        this.starship_z_coord = 0;
        this.obstacle_coord = [0];


        // Smooth movement variables
        this.start_pos;
        this.fin_pos;
        this.start_time;
        this.moving_left;
        this.moving_right
        
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
                x_coord = -10;
            } else if (rand === 2) {
                x_coord = 10;
            } else if (rand === 3) {
                x_coord = -5;
            } else {
                x_coord = 5;
            }
            this.obstacle_coord[i][0] = x_coord;
            this.obstacle_collision_coord[i][0] = x_coord;
        }

        // to make sure texture initialization only happens once (for shadows)
        this.init_ok = false;
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

    draw_starship(context, program_state, shadow_pass) {
        // ***** DRAW STARSHIP *****
        let starship_transform = Mat4.identity();
        // move starship to correct y-coord and scale to make it a rectangle
        starship_transform = starship_transform.times(Mat4.translation(this.starship_x_coord,this.starship_y_coord,0))
                                                .times(Mat4.scale(1.2,1,1.5));     
        this.shapes.starship.draw(context, program_state, starship_transform, shadow_pass? this.materials.starship : this.pure);

        //Logic for drawing wheels
        let wheel_transform = Mat4.identity();
        wheel_transform = wheel_transform.times(Mat4.translation(this.starship_x_coord, this.starship_y_coord, 0));
        wheel_transform = wheel_transform.times(Mat4.rotation(Math.PI/2, 0, 1, 0));

        let wheel_y = -0.75;
        let wheel_x = 1;
        let wheel_z = 1.5*0.9;
        let wheel_scale_size = 0.65;
        
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(wheel_x, wheel_y, wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(wheel_x, wheel_y, -wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(0, wheel_y, wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(0, wheel_y, -wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(-wheel_x, wheel_y, wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);
        this.shapes.starship_wheel.draw(context, program_state, wheel_transform.times(Mat4.translation(-wheel_x, wheel_y, -wheel_z)).times(Mat4.scale(wheel_scale_size, wheel_scale_size, wheel_scale_size)), shadow_pass? this.materials.wheel : this.pure);


        //Logic for drawing wheel axel
        let axel_transform = Mat4.identity();
        axel_transform = axel_transform.times(Mat4.translation(this.starship_x_coord, this.starship_y_coord-wheel_z/1.85, 0));
        axel_transform = axel_transform.times(Mat4.rotation(Math.PI/2, 0, 1, 0)); // rotate 90 degrees
        axel_transform = axel_transform.times(Mat4.scale(0.3, 0.3, 2.8)); // change shape of cylinder to resember thin flag rod
        this.shapes.axel.draw(context, program_state, axel_transform, shadow_pass? this.materials.axel : this.pure);
        this.shapes.axel.draw(context, program_state, axel_transform.times(Mat4.translation(wheel_x/0.3, 0, 0)), shadow_pass? this.materials.axel : this.pure);
        this.shapes.axel.draw(context, program_state, axel_transform.times(Mat4.translation(-wheel_x/0.3, 0, 0)), shadow_pass? this.materials.axel : this.pure);

        // Logic for drawing flag
        let flag_transform = Mat4.identity();
        flag_transform = flag_transform.times(Mat4.translation(this.starship_x_coord+1, this.starship_y_coord+3, -1.4));
        flag_transform = flag_transform.times(Mat4.rotation(Math.PI/2, 1, 0, 0));
        flag_transform = flag_transform.times(Mat4.scale(0.05, 0.05, 4));

        this.shapes.axel.draw(context, program_state, flag_transform, shadow_pass? this.materials.flag_pole : this.pure);

        let triangle_transform = Mat4.identity();
        triangle_transform = triangle_transform.times(Mat4.translation(this.starship_x_coord+1, -2, -0.45))
        triangle_transform = triangle_transform.times(Mat4.scale(0.08, 0.5, 1));
        this.shapes.flag.draw(context, program_state, triangle_transform, shadow_pass? this.materials.flag : this.pure);


        //Logic for other decoration on starship
        let brakelights_transform = Mat4.identity();
        brakelights_transform = brakelights_transform.times(Mat4.translation(this.starship_x_coord, this.starship_y_coord+0.5, 1.5)).times(Mat4.scale(0.3, .05, 0.1))
        this.shapes.starship.draw(context, program_state, brakelights_transform.times(Mat4.translation(-2, 0, 0)), shadow_pass? this.materials.test.override({color: hex_color("#FF0000")}) : this.pure);
        this.shapes.starship.draw(context, program_state, brakelights_transform.times(Mat4.translation(2, 0, 0)), shadow_pass? this.materials.test.override({color: hex_color("#FF0000")}) : this.pure);

        let lid_transform = Mat4.identity();
        lid_transform = lid_transform.times(Mat4.translation(this.starship_x_coord, this.starship_y_coord+0.5, 0)).times(Mat4.scale(1.21, .05, 1.51));
        this.shapes.starship.draw(context, program_state, lid_transform, shadow_pass? this.materials.test.override({color: hex_color("#000000")}) : this.pure);
    }


    // from shadow demo given in class (over email)
    texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();

        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.materials.starship.light_depth_texture = this.light_depth_texture
        this.materials.wheel.light_depth_texture = this.light_depth_texture
        this.materials.axel.light_depth_texture = this.light_depth_texture
        this.materials.flag_pole.light_depth_texture = this.light_depth_texture
        this.materials.flag.light_depth_texture = this.light_depth_texture
        // this.floor = this.light_depth_texture
        this.materials.royce_floor.light_depth_texture = this.light_depth_texture
        this.materials.obstacle.light_depth_texture = this.light_depth_texture
        // this.shapes.background.light_depth_texture = this.light_depth_texture

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // *** from shadow demo ***

        let light_position = this.light_position;
        let light_color = this.light_color;
        program_state.draw_shadow = draw_shadow;

        let light_transform = Mat4.identity();
        // light_transform = light_transform.times(Mat4.translation(10, 0, 1)).times(Mat4.scale(.5,.5,.5));
        light_transform = light_transform.times(Mat4.translation(light_position[0], light_position[1], light_position[2])).times(Mat4.scale(.5,.5,.5));

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, program_state,
                light_transform,
                this.light_src.override({color: light_color}));
        }

        // *** END from shadow demo ***

        // Starship Movement Controls

        let smooth_move_speed = 0.25;

        if(this.moving_left){
            let time_diff = t - this.start_time;
            if (time_diff > smooth_move_speed) {
                this.starship_x_coord = this.start_pos - this.starship_x_movement;
                this.moving_left = false;
            }
            else if (this.starship_x_coord <= this.fin_pos) {
                this.moving_left = false;
                this.starship_x_coord = this.start_pos - this.starship_x_movement;
            }
            else {
                this.starship_x_coord = this.start_pos - time_diff * this.starship_x_movement / smooth_move_speed;
            }
        }
        else if(this.moving_right){
            let time_diff = t - this.start_time;
            if (time_diff > smooth_move_speed) {
                this.starship_x_coord = this.start_pos + this.starship_x_movement;
                this.moving_right = false;
            }
            else if (this.starship_x_coord >= this.fin_pos) {
                this.moving_right = false;
                this.starship_x_coord = this.start_pos + this.starship_x_movement;
            }
            else {
                this.starship_x_coord = this.start_pos + time_diff * this.starship_x_movement / smooth_move_speed;
            }
        }
        else {
            if(this.move_left && this.starship_x_coord >= -this.starship_x_movement) {
                this.move_left = false;
                this.moving_left = true;
                this.start_time = t;
                this.start_pos = this.starship_x_coord;
                this.fin_pos = this.starship_x_coord - this.starship_x_movement;
            }
            if(this.move_right && this.starship_x_coord <= this.starship_x_movement) {
                this.move_right = false;
                this.moving_right = true;
                this.start_time = t;
                this.start_pos = this.starship_x_coord;
                this.fin_pos = this.starship_x_coord + this.starship_x_movement;
            } 
        }
        
        this.draw_starship(context, program_state, shadow_pass);

        // ***** DRAW BACKGROUND *****
        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.rotation(-Math.PI*(1/7), 1, 0, 0))
                                                    .times(Mat4.translation(0, 4, -15))
                                                    .times(Mat4.scale(28, 12, 1));

        this.shapes.background.draw(context, program_state, background_transform, this.materials.royce);

        // ***** DRAW GROUND *****
        let ground_transform = Mat4.identity();
        ground_transform = ground_transform.times(Mat4.rotation(-Math.PI*(4/7), 1, 0, 0))
                                                    .times(Mat4.translation(0, 65, -8.5))
                                                    .times(Mat4.scale(30, 70, 1));

        this.shapes.background.draw(context, program_state, ground_transform, this.materials.royce_floor);
        this.shapes.background.draw(context, program_state, ground_transform, shadow_pass? this.materials.royce_floor : this.pure);



        const yellow = hex_color("#fac91a");
        let model_transform = Mat4.identity();

        for (let i = 1; i < 901; i++) {
            let obstacle_transform = Mat4.identity();
            obstacle_transform = obstacle_transform
                .times(Mat4.translation(this.obstacle_coord[i][0], this.obstacle_coord[i][1]-1, this.obstacle_coord[i][2] + this.z_fall * t))
                .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
                .times(Mat4.scale(1, 1, 3));
            this.shapes.axel.draw(context, program_state, obstacle_transform, shadow_pass? this.materials.obstacle.override({color: hex_color("#C0C0C0")}) : this.pure);
            // this.shapes.torus.draw(context, program_state, model_transform.times(Mat4.translation(this.obstacle_coord[i][0], this.obstacle_coord[i][1], this.obstacle_coord[i][2] + this.z_fall * t)), this.materials.test.override({color: yellow}));
            this.obstacle_collision_coord[i] = [this.obstacle_collision_coord[i][0], this.obstacle_collision_coord[i][1], this.z_offset * i + this.z_fall * t];
            if (this.touched(this.obstacle_collision_coord[i], [this.starship_x_coord, this.starship_y_coord, this.starship_z_coord])) {
                // put your collision function here
                let starship_transform = Mat4.identity();
                // move starship to correct y-coord and scale to make it a rectangle
                starship_transform = starship_transform.times(Mat4.translation(this.starship_x_coord,this.starship_y_coord,0))
                                                        .times(Mat4.scale(1.2,1,1.5));  
                this.shapes.starship.draw(context, program_state, starship_transform.times(Mat4.translation(0, 0, -5)), this.materials.starship);
            }
        }
    }


    display(context, program_state) {
        // display():  Called once per frame of animation.

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const gl = context.context;

        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }


        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        // code originaly adapted from shadow demo given in class (over email)
        // The position of the light
            // oscilate light left to right to give illusion of time
        let x_pos = 11*Math.sin(t / 10);
        this.light_position = vec4(x_pos, 4, -5, 1);

    
        // The color of the light
        this.light_color = hex_color("#ffffff");

        // This is a rough target of the light.
        // Although the light is point light, we need a target to set the POV of the light
        this.light_view_target = vec4(0, 0, 0, 1);
        // this.light_view_target = vec4(10, 1, 8, 1);

        this.light_field_of_view = 130 * Math.PI / 180; // 130 degree
        // this.light_field_of_view = 2;

        program_state.lights = [new Light(this.light_position, this.light_color, 1000)];

        // Step 1: set the perspective and camera to the POV of light
        const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false,false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.render_scene(context, program_state, true,true, true);

    }
}