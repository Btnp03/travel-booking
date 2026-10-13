import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass phone to auth service on register', () => {
    const body = {
      email: 'demo@example.com',
      password: 'secret',
      phone: '0812345678',
    };

    controller.register(body);

    expect(authService.register).toHaveBeenCalledWith(
      body.email,
      body.password,
      body.phone,
    );
  });
});
