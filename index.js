const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite3').verbose()
const dbConnection = new sqlite.Database(path.resolve(__dirname, './banco.db'), { Promise })

const port = process.env.PORT || 3000

app.use('/admin', (req, res, next) => {
  if (req.hostname==='localhost') {
    next()
  }else{
    res.send('not allowed')
  }
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: true }))

const sql = ['SELECT * FROM categorias', 'SELECT * FROM vagas', 'DELETE FROM vagas WHERE id=']

app.get('/', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0], (err, cat) => {
    if (err) {
      return console.log('Erro: ', err.message)
    }
    db.all(sql[1], (err, vagas) => {
      if (err) {
        return console.log('Erro: ', err.message)
      }
      const categorias = cat.map(cat => {
        return {
          ...cat,
          vagas: vagas.filter(vaga => vaga.categoria === cat.id)
        }
      })
      res.render('home', {
        categorias: categorias
      })
    })
  })


})

app.get('/vaga/:id', async (req, res) => {
  const db = await dbConnection
  await db.get(`SELECT * FROM vagas WHERE id=${req.params.id}`, (err, vaga) => {
    if (err) {
      return console.log('Erro: ', err.message)
    }
    res.render('vaga', {
      vaga
    })
  })

})

app.get('/admin', (req, res) => {
  res.render('admin/home')
})

app.get('/admin/vagas', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[1], (err, vaga) => {
    if (err) {
      return console.log(err.message)
    }
    res.render('admin/vagas', {
      vaga
    })
  })
})

app.get('/admin/categorias', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0], (err, categorias) => {
    if (err) {
      return console.log(err.message)
    }
    res.render('admin/categorias', {
      categorias
    })
  })
})

app.get('/admin/vagas/delete/:id', async (req, res) => {
  const db = await dbConnection
  await db.run(sql[2] + req.params.id, (err, rows) => {
    if (err) {
      return console.log(err.message)
    }
    res.redirect('/admin/vagas')
  })
})

app.get('/admin/categorias/delete/:id', async (req, res) => {
  const db = await dbConnection
  await db.run('DELETE FROM categorias WHERE id=' + req.params.id, (err, rows) => {
    if (err) {
      return console.log(err.message)
    }
    res.redirect('/admin/categorias')
  })
})

app.get('/admin/vagas/nova', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0], (err, categorias) => {
    if (err) {
      return console.log(err.message)
    }
    res.render('admin/nova-vaga', {
      categorias
    })
  })
})

app.get('/admin/categorias/nova', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0], (err, categorias) => {
    if (err) {
      return console.log(err.message)
    }
    res.render('admin/nova-categoria', {
      categorias
    })
  })
})

app.post('/admin/vagas/nova', async (req, res) => {
  const db = await dbConnection
  const { titulo, descricao, categoria } = req.body
  await db.run(`INSERT INTO vagas(categoria, titulo, descricao) VALUES(${categoria},'${titulo}', '${descricao}')`, (err, row) => {
    if (err) {
      console.log(err.message)
    }
    res.redirect('/admin/vagas')
  })
})

app.post('/admin/categorias/nova', async (req, res) => {
  const db = await dbConnection
  const { categoria } = req.body
  await db.run(`INSERT INTO categorias(categoria) VALUES('${categoria}')`, (err, row) => {
    if (err) {
      console.log(err.message)
    }
    res.redirect('/admin/categorias')
  })
})

app.get('/admin/vagas/update/:id', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0], (err, categorias) => {
    if (err) {
      return console.log(err.message)
    }
    db.all('SELECT * FROM vagas WHERE id=' + req.params.id, (err, vaga) => {
      if (err) {
        return console.log(err.message)
      }
      res.render('admin/editar-vaga', {
        vaga,
        categorias
      })
    })
  })
})

app.post('/admin/vagas/update/:id', async (req, res) => {
  const db = await dbConnection
  const { titulo, descricao, categoria } = req.body
  const { id } = req.params
  await db.run(`UPDATE vagas SET categoria=${categoria}, titulo='${titulo}', descricao='${descricao}' WHERE id=${id}`, (err, row) => {
    if (err) {
      console.log(err.message)
    }
    res.redirect('/admin/vagas')
  })
})

app.get('/admin/categorias/update/:id', async (req, res) => {
  const db = await dbConnection
  await db.all(sql[0] + ' WHERE id=' + req.params.id, (err, categoria) => {
    if (err) {
      return console.log(err.message)
    }
    res.render('admin/editar-categoria', {
      categoria
    })
  })
})

app.post('/admin/categorias/update/:id', async (req, res) => {
  const db = await dbConnection
  const { categoria } = req.body
  const { id } = req.params
  await db.run(`UPDATE categorias SET categoria='${categoria}' WHERE id=${id}`, (err, row) => {
    if (err) {
      console.log(err.message)
    }
    res.redirect('/admin/categorias')
  })
})


const init = async () => {
  const db = await dbConnection
  // tabelas categoria
  await db.run('CREATE TABLE IF NOT EXISTS categorias(id INTEGER PRIMARY KEY, categoria TEXT)', (err, row) => {
    if (err) {
      console.log(err.message)
    }
  })

  // tabela vagas
  await db.run('CREATE TABLE IF NOT EXISTS vagas(id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT)', (err, row) => {
    if (err) {
      console.log(err.message)
    }
  })

  /*const categoria = 'Marketing team'
  await db.run(`INSERT INTO categorias(categoria) VALUES('${categoria}')`, (err, row) => {
    if (err) {
      console.log(err.message)
    } else {
      console.log(`Categoria adicionada com sucesso: ${row}`)
    }

  })*/

  /*const vaga = 'JavaScript Developer (New York)'
  const descricao = 'Vaga para JavaScript developer que fez o Fullstack Lab'
  await db.run(`INSERT INTO vagas(categoria, titulo, descricao) VALUES(1,'${vaga}', '${descricao}')`, (err, row) => {
    if (err) {
      console.log(err.message)
    } else {
      console.log(`Vaga adicionada com sucesso!`)
    }

  })*/
}

init()

app.listen(port, (err) => {
  if (err) {
    console.log('Não foi possível iniciar o servidor do Jobify.')
  } else {
    console.log('Servidor do Jobify rodando...')
  }
})