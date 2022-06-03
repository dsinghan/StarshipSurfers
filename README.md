## Starship Surfers

### Theme:
Our project theme follows the adventure of a Starship robot at UCLA weaving through different obstacles on its way to make a delivery. Our project is based off the popular mobile game *Subway Surfers* where the view is at a top down angle and the game ends as soon as the player hits an obstacle. The scene of our project is UCLA-themed; the background displays Royce Hall and various obstacles pass by to give the illusion that the Starship is moving forward.

### Topics used:
This project applies several different computer graphics techniques we have learnt in our class. Since our project involves movement, we made use of transposition and scaling to give the impression that our starship is moving through the scene. We also emulated sun movement to provide dynamic shadows, adding the illusion of time passing by. Further, we employed collision detection in the game logic, to enforce the idea that the player must avoid the obstacles.

### Interactivity:
The player is able to move the Starship left and right on the x-axis (with boundaries) to dodge obstacles. The player can use 'ctrl+a' to move the starship to the left if it's within the boundaries. The player can use 'ctrl+d' to move the starship to the right if it's within the boundaries. There are five 'lanes' in which the Starship can position itself, and objects spawn in one of these five lanes every time. The player begins the game in the center lane.

### Advanced features:
We implemented two main advanced features in our project. First, we implemented collision detection: when the Starship model collides with an obstacle model, the game detects this and stops the game. Second, we implemented shadowing: when the source of lighting from the 'sun' moves, so do the shadows of the Starship and the moving obstacles.

### How to run the code:
1. The user must either clone this respository or download the ZIP onto their local computer and file system.
2. The user must navigate to the new folder.
3. Depending on their OS, the user must either run host.bat (Windows) or host.command (Mac).
4. The user must navigate to the URL http://localhost:8001/ (the port number in the URL must match the port number specified in the command window in step 3).
5. If all steps are followed correctly, the project should show up at this new URL, and the user can begin playing the game.
