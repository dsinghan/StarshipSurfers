import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.num_iterations = 997;

        this.rand_values = Array.from({length: this.num_iterations}, () => (Math.random(1)) + 1);

        // *** Shapes
        this.shapes = {
            torus: new defs.Torus(15, 15),
            starship: new defs.Cube(),
            background: new defs.Square,
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            starship: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: 1, color: hex_color("#ffffff")}),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
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

        // NEW GLOBAL VARIABLES
        // Starship variables
        this.starship_y_coord = -7;                 // starship y-coord from centre
        this.starship_x_coord = 0;                  // shifted depending on movement controls
        this.starship_x_movement = 3;               // how much move in x direction every press
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

        // how many times we want the objects to fall
        const x_offset = 7.5
        const y_offset = 10
        const y_fall = 2;
        const z_fall = 1;
        const z_offset = -5;

        for (let i = 1; i < this.num_iterations/3; i++) {
            let rand_val_1 = this.rand_values[this.num_iterations % (i*1)]
            let rand_val_2 = this.rand_values[this.num_iterations % (i*2)]
            let rand_val_3 = this.rand_values[this.num_iterations % (i*3)]
            let model_transform_block_left = model_transform.times(Mat4.translation(-x_offset, y_offset * i * rand_val_1 - y_fall * t * rand_val_1, z_offset * (i-1) * rand_val_1 +z_fall * t * rand_val_1));
            let model_transform_block_middle = model_transform.times(Mat4.translation(0, y_offset * i * rand_val_2 - y_fall * t * rand_val_2, z_offset * (i-1) * rand_val_2 + z_fall * t * rand_val_2));
            let model_transform_block_right = model_transform.times(Mat4.translation(x_offset, y_offset * i * rand_val_3 - y_fall * t * rand_val_3, z_offset * (i-1) * rand_val_3 + z_fall * t * rand_val_3));
            this.shapes.torus.draw(context, program_state, model_transform_block_left, this.materials.test.override({color: yellow}));
            this.shapes.torus.draw(context, program_state, model_transform_block_middle, this.materials.test.override({color: yellow}));
            this.shapes.torus.draw(context, program_state, model_transform_block_right, this.materials.test.override({color: yellow}));
        }


        // *******************************
        // ********** NEW STUFF **********
        // *******************************

        // Variables

        // Starship Movement Controls
        if(this.move_left) {
            console.log("running move_left");
            this.move_left = !this.move_left;
            this.starship_x_coord -= this.starship_x_movement;
        }
        if(this.move_right) {
            console.log("running move_right");
            this.move_right = !this.move_right;
            this.starship_x_coord += this.starship_x_movement;
            // starship_transform = starship_transform.times(Mat4.translation(-3,0,0));
        }

        // ***** DRAW STARSHIP *****
        let starship_transform = Mat4.identity();
        // move starship to correct y-coord and scale to make it a rectangle
        starship_transform = starship_transform.times(Mat4.translation(this.starship_x_coord,this.starship_y_coord,0))
                                                .times(Mat4.scale(1.2,1,1.5));     
        

        this.shapes.starship.draw(context, program_state, starship_transform, this.materials.starship);

        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.scale(10, 5, 1));




        this.shapes.background.draw(context, program_state, background_transform, this.materials.texture);
        
    }
}