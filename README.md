# musicmaestro
A music recommendation application.

To test it out locally, you will 2 terminals, as flask and react both run at same time on different ports.

You can run the flask part in the same way as before - “flask --app main run” (in music maestro directory). You might have to install a few more python modules if it says so in terminal (through pip should work like before).

To then run the react portion, you need to cd into the
musicmaestro/frontend directory and run “npm start” - if it gives you an error, I believe npm is part of Node.js so you might need to install that (not too sure though, it worked fine for me).

Also, you will need to run “npm install axios” as well for react to work when you run it.

