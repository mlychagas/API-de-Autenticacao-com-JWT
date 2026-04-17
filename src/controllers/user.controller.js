/**
 * user.controller.js
 * 
 * Controlador de Usuários
 * Implementa a lógica de operações em dados de usuários.
 * Rotas aqui são PROTEGIDAS e exigem autenticação via JWT.
 */

/**
 * Mock de usuários para demonstração
 * Em produção: usar banco de dados
 */

/**
 * Controlador: Listar Usuários
 * 
 * Implementa autorização baseada em perfil (role):
 * - Admin: Vê todos os usuários
 * - Moderador: Vê usuários do seu departamento
 * - Usuário comum: Vê apenas seus próprios dados
 * 
 * Requisição:
 * GET /usuarios
 * Authorization: Bearer <accessToken>
 * 
 * Resposta (200 OK):
 * {
 *   "message": "Usuários recuperados com sucesso",
 *   "count": 3,
 *   "users": [...]
 * }
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.user - Payload decodificado do JWT (injetado por checkAuth)
 * @param {string} req.user.sub - ID do usuário autenticado
 * @param {string} req.user.role - Perfil do usuário
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Middleware de erro
 */
const listar = async (req, res, next) => {
  try {
    const usuarioAutenticado = req.user;
    let usuariosRetornados = [];

    if (usuarioAutenticado.role === 'admin') {
      usuariosRetornados = mockUsers;
    } else if (usuarioAutenticado.role === 'moderador') {
      const moderador = mockUsers.find((u) => u.id === usuarioAutenticado.sub);
      usuariosRetornados = mockUsers.filter(
        (u) => u.department === moderador.department
      );
    } else {
      usuariosRetornados = mockUsers.filter(
        (u) => u.id === usuarioAutenticado.sub
      );
    }

    const usuariosFormatados = usuariosRetornados.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.department,
      ...(usuarioAutenticado.role === 'admin' && { email: u.email }),
    }));

    res.status(200).json({
      message: 'Usuários recuperados com sucesso',
      count: usuariosFormatados.length,
      users: usuariosFormatados,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador: Obter dados do usuário autenticado
 * 
 * Retorna os dados pessoais do usuário autenticado.
 * Rota protegida: requer Access Token válido.
 * 
 * Requisição:
 * GET /usuarios/me
 * Authorization: Bearer <accessToken>
 * 
 * Resposta (200 OK):
 * {
 *   "message": "Dados do usuário recuperados",
 *   "user": {
 *     "id": "2",
 *     "email": "user@example.com",
 *     "name": "João Silva",
 *     "role": "usuario",
 *     "department": "Vendas"
 *   }
 * }
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.user - Payload decodificado do JWT
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Middleware de erro
 */
const obterPerfil = async (req, res, next) => {
  try {
    const usuarioAutenticado = req.user;
    const usuario = mockUsers.find((u) => u.id === usuarioAutenticado.sub);

    if (!usuario) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuário não encontrado',
      });
    }

    res.status(200).json({
      message: 'Dados do usuário recuperados',
      user: usuario,
    });
  } catch (error) {
    next(error);
  }
};

const atualizarPerfil = async (req, res, next) => {
  try {
    const usuarioAutenticado = req.user;
    const { name, department } = req.body;

    const usuario = mockUsers.find((u) => u.id === usuarioAutenticado.sub);

    if (!usuario) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuário não encontrado',
      });
    }

    if (name) usuario.name = name;
    if (department) usuario.department = department;

    res.status(200).json({
      message: 'Perfil atualizado com sucesso',
      user: usuario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador: Excluir usuário (apenas admin)
 */
const excluir = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar usuário
    const usuarioIndex = mockUsers.findIndex((u) => u.id === id);

    if (usuarioIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Usuário não encontrado',
      });
    }

    // Remover usuário
    const usuarioRemovido = mockUsers.splice(usuarioIndex, 1);

    res.status(200).json({
      message: 'Usuário excluído com sucesso',
      user: usuarioRemovido[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obterPerfil,
  atualizarPerfil,
  excluir,
};
