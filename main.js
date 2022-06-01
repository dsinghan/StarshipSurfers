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

        this.rand_values = Array.from({length: this.num_iterations}, () => (Math.floor(Math.random() * 3)));

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
            starship: new Material(new Textured_Phong(),
                {ambient: .5, 
                 diffusivity: .1,
                 specularity: .1,
                 color: hex_color("#ffffff"),
                 texture: new Texture("assets/stars.png")
                }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/royce.jpg")
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
        this.z_fall = 10;

        // NEW GLOBAL VARIABLES
        // Starship variables
        this.starship_y_coord = -7;                 // starship y-coord from centre
        this.starship_x_coord = 0;                  // shifted depending on movement controls
        this.starship_x_movement = 10;               // how much move in x direction every press
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
        }

        // ***** DRAW STARSHIP *****
        let starship_transform = Mat4.identity();
        // move starship to correct y-coord and scale to make it a rectangle
        starship_transform = starship_transform.times(Mat4.translation(this.starship_x_coord,this.starship_y_coord, 2))
                                                .times(Mat4.scale(1.2,1,3));
        
        this.shapes.starship.draw(context, program_state, starship_transform, this.materials.starship);

        // ***** DRAW BACKGROUND *****
        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.rotation(-Math.PI*(1/7), 1, 0, 0))
                                                    .times(Mat4.translation(0, 0, -5))
                                                    .times(Mat4.scale(22, 12, 1));

        this.shapes.background.draw(context, program_state, background_transform, this.materials.texture);

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