import pygame
import time

pygame.init()

pygame.joystick.init()

joystick_count = pygame.joystick.get_count()

if joystick_count == 0:
    print("No joysticks detected")
else:
    joystick = pygame.joystick.Joystick(0)
    joystick.init()

    print(f"Detected joystick: {joystick.get_name()}")

    while True:
        pygame.event.pump()
        time.sleep(.1)
        
        for i in range(joystick.get_numbuttons()):
            button = joystick.get_button(i)
            if button == 1:
                print(f"Button {i} pressed.")
        
        for i in range(joystick.get_numaxes()):
            axis = joystick.get_axis(i)
            if axis != 0:
                print(f"Axis {i} value: {axis}")
        
        for i in range(joystick.get_numhats()):
            hat = joystick.get_hat(i)
            if hat != (0,0):
                print(f"Hat {i} value: {hat}")