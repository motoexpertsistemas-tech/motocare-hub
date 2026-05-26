import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShieldCheck, Calendar } from "lucide-react";
import ottoLogo from "@/assets/otto-tech-logo.png";

export default function TermosDeUso() {
  return (
    <div className="landing-dark min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0F0F12] to-[#0A0A0A] text-gray-200 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[hsl(3, 62%, 46%)]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-[hsl(3, 62%, 46%)]/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <img src={ottoLogo} alt="Otto Tech Sistemas" className="h-9 w-9 rounded-full object-cover ring-2 ring-[hsl(3, 62%, 46%)]/40" />
            <span className="font-bold text-white tracking-tight">Otto Tech Sistemas</span>
          </Link>
          <Link to="/cadastro">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/5">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao cadastro
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-12">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 md:p-12 mb-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(3, 62%, 46%)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(3, 62%, 46%)]/15 border border-[hsl(3, 62%, 46%)]/30 mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-[hsl(0,84%,60%)]" />
              <span className="text-xs font-semibold text-[hsl(0,84%,75%)] tracking-wide uppercase">Documento Legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight leading-tight">
              Contrato de Licença de Uso<br/>
              <span className="bg-gradient-to-r from-[hsl(0,84%,55%)] to-[hsl(15,90%,60%)] bg-clip-text text-transparent">de Software e Termo de Uso</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Última atualização: <span className="text-white font-medium">05/05/2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                12 cláusulas
              </div>
            </div>
          </div>
        </div>

        <article className="rounded-2xl border border-white/10 bg-[#0F0F12]/60 backdrop-blur p-8 md:p-12 shadow-xl prose prose-invert max-w-none space-y-5 text-[15px] leading-relaxed [&_h2]:!pt-6 [&_h2]:!mt-2 [&_h2]:!mb-3 [&_h2]:!pb-2 [&_h2]:!border-b [&_h2]:!border-white/10 [&_ul]:!marker:text-[hsl(0,84%,55%)] [&_p]:!text-gray-300 [&_li]:!text-gray-300">
          <p>
            Pelo presente instrumento particular de licença de uso de software, de um lado, <strong>OTTO TECH SISTEMAS</strong>, com sede na cidade de Tobias Barreto, Estado de Sergipe, na Travessa Paulino de Andrade, n.º 56, doravante denominada <strong>"CONTRATADA"</strong>; e, de outro lado, a pessoa, física ou jurídica, doravante denominada <strong>"USUÁRIO"</strong> ou <strong>"CONTRATANTE"</strong>, identificada na Confirmação Contratual, conforme a legislação vigente, têm entre si justo e avençado o seguinte:
          </p>

          <h2 className="text-xl font-bold text-white pt-4">Considerações Preliminares</h2>
          <p><strong>I.</strong> Ao optar por uma das contas oferecidas, o USUÁRIO automaticamente concederá aceitação irrevogável ao conteúdo do presente instrumento e concorda, ainda, que qualquer indivíduo que utilizar sua conta em seu nome também respeitará as condições aqui estipuladas.</p>
          <p><strong>II.</strong> A aceitação deste contrato manifesta a vontade inequívoca das Partes do contrato celebrado por meio eletrônico, bem como a concordância com as condições necessárias para a utilização do serviço, listadas abaixo. A não aceitação ou a violação dessas condições implicará o encerramento da conta do USUÁRIO.</p>
          <p><strong>III.</strong> A CONTRATADA se resguarda o direito de revisar estas condições a qualquer momento, sendo que o uso continuado do serviço por parte do USUÁRIO será considerado aceitação tácita de tais revisões. O USUÁRIO está desde já ciente de que a versão mais atual poderá ser consultada a qualquer momento no site.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 1 – Definições</h2>
          <p><strong>1.1.</strong> Para o perfeito entendimento e interpretação deste Contrato, fica estabelecido que:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> "USUÁRIO/USUÁRIOS" é a pessoa física ou jurídica que contrata o Serviço.</li>
            <li><strong>b)</strong> "CENTRAL DE ATENDIMENTO" é o serviço de suporte técnico disponibilizado ao USUÁRIO pelo telefone/WhatsApp (79) 99627-7245 e por e-mail: ottotechsistemas@gmail.com.</li>
            <li><strong>c)</strong> "SOFTWARE" é a disponibilização, pela CONTRATADA, de um conjunto de ferramentas e serviços online (sistema ERP) destinados aos USUÁRIOS. Os serviços são fornecidos mediante acesso à internet, por meio de dispositivos próprios de propriedade do USUÁRIO. Para tanto, a CONTRATADA se exime de qualquer responsabilidade sobre os equipamentos e meios de acesso utilizados pelos USUÁRIOS, como, por exemplo, computador, provedores de acesso à internet, modem, etc.</li>
            <li><strong>d)</strong> "WEBSITE" é a página ou sequência de páginas do software desenvolvido pela CONTRATADA, com a finalidade de ofertar o Serviço.</li>
            <li><strong>e)</strong> "DADOS PESSOAIS" são as informações relacionadas às pessoas naturais identificadas ou identificáveis.</li>
            <li><strong>f)</strong> "DADOS PESSOAIS SENSÍVEIS" são os dados pessoais sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dados referentes à saúde ou à vida sexual, dado genético ou biométrico, quando vinculado a uma pessoa natural.</li>
            <li><strong>g)</strong> "DADOS ANONIMIZADOS" são os dados relativos aos titulares que não possam ser identificados, considerando a utilização de meios técnicos razoáveis e disponíveis na ocasião de seu tratamento.</li>
            <li><strong>h)</strong> "PARTE CONTROLADORA" é a parte a quem competem as decisões referentes ao tratamento de dados pessoais.</li>
            <li><strong>i)</strong> "PARTE OPERADORA" é a parte que realiza o tratamento de dados pessoais em nome da Parte Controladora.</li>
          </ul>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 2 – Objeto e Prazo de Duração</h2>
          <p><strong>2.1.</strong> Pelo presente contrato, compromete-se a CONTRATADA a fornecer à CONTRATANTE a licença de uso do sistema ERP descrito neste documento, compreendendo ainda a manutenção e suporte técnico do mesmo. A referida prestação de serviços será fornecida pela CONTRATADA por meio de profissionais com treinamento técnico específico para tal.</p>
          <p><strong>2.2.</strong> A CONTRATADA oferece planos na modalidade mensal, trimestral, semestral e anual, cujas especificidades estão descritas na página principal do WEBSITE.</p>
          <p><strong>2.3.</strong> O serviço será prestado nos formatos abaixo ofertados:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Acesso pago com diversas opções de pacotes de funcionalidades, cujo detalhamento é apresentado ao USUÁRIO em página própria;</li>
            <li><strong>b)</strong> Pagamento via boleto bancário, PIX ou cartão de crédito, sendo o pagamento em parcelas permitido somente na modalidade cartão de crédito;</li>
            <li><strong>c)</strong> Período de teste de 10 (dez) dias corridos, em que a CONTRATANTE terá acesso a todas as funcionalidades do sistema ERP da plataforma da CONTRATADA, devendo, após esse período, fazer a opção pelo plano e duração a ser contratado, podendo ser alterado ao final do período licenciado;</li>
            <li><strong>d)</strong> Possibilidade de cancelamento no prazo máximo de 7 (sete) dias da escolha do plano, realizada após o período de teste mencionado no item acima;</li>
            <li><strong>e)</strong> Possibilidade de upgrade de forma imediata em relação ao plano escolhido, mediante a contratação de um novo plano (utilização do crédito remanescente do plano anterior para extensão do período de uso no novo plano);</li>
            <li><strong>f)</strong> Possibilidade de downgrade de forma imediata em relação ao plano escolhido, entretanto, sem possibilidade de devolução do valor pago a maior (utilização do crédito pago a maior para extensão do período de uso).</li>
          </ul>
          <p><strong>2.4.</strong> A CONTRATADA se reserva o direito de mudar, modificar, suspender ou descontinuar qualquer porção do WEBSITE a qualquer momento, bem como as opções de contas, valores e formatos a serem ofertados ao USUÁRIO.</p>
          <p><strong>2.5.</strong> Ao final do período contratado, o SOFTWARE apresentará um alerta de expiração com prazo de 7 (sete) dias para a CONTRATANTE renovar sua opção pelo plano escolhido ou optar por outro plano. Caso a opção não seja feita, o uso do SOFTWARE será bloqueado.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 3 – Preço do Serviço</h2>
          <p><strong>3.1.</strong> O USUÁRIO deverá pagar à CONTRATADA o valor do plano de licenciamento escolhido e conforme a periodicidade definida entre as opções de pagamento disponibilizadas de forma online no ato da contratação.</p>
          <p><strong>3.2.</strong> A data de vencimento será a data do ato de contratação, com um novo pagamento a cada renovação da periodicidade escolhida. Caso o pagamento seja por boleto bancário, o pagamento se dará em parcela única, antecipada.</p>
          <p><strong>3.3.</strong> O CONTRATANTE poderá, à sua livre escolha, optar pela renovação automática de contrato. Neste caso, serão renovados os mesmos recursos, plano, duração e condições de pagamento da última contratação. O valor das prestações sofrerá variação em decorrência do reajuste anual previsto neste instrumento.</p>
          <p><strong>3.4.</strong> A renovação automática somente será habilitada pelo CONTRATANTE ou por qualquer pessoa autorizada por ele a realizar esta ação em página própria. A CONTRATADA não realizará a renovação automática sem que esta tenha sido habilitada pelo CONTRATANTE.</p>
          <p><strong>3.5.</strong> Caso o CONTRATANTE queira realizar qualquer forma de alteração nos itens contratados, este deverá desligar a renovação automática e realizar manualmente a contratação conforme desejado.</p>
          <p><strong>3.6.</strong> A CONTRATADA manterá, na oferta de renovação automática, as condições especiais de desconto progressivo conforme o período contratado, disponíveis para consulta pelo CONTRATANTE em página própria.</p>
          <p><strong>3.7.</strong> Caso a CONTRATANTE, após a renovação automática, mude de ideia por qualquer motivo e opte pelo encerramento do contrato, este estará sujeito ao atendimento de todas as condições de cancelamento previstas neste instrumento.</p>
          <p><strong>3.8.</strong> A renovação automática do plano será processada 3 (três) dias antes da data de vencimento. Para evitar a renovação, o CONTRATANTE deve desativar a função na página de gerenciamento antes desse processamento.</p>
          <p><strong>3.9.</strong> Os valores ora pactuados serão corrigidos, anualmente, pelo IPCA, IGPM ou outro indexador oficial que venha a substituí-lo. A correção dar-se-á periodicamente a cada 12 (doze) meses.</p>
          <p><strong>3.10.</strong> A falta de pagamento dos valores acordados nas respectivas datas de vencimento não acarretará rescisão automática do contrato, mas implicará na suspensão do acesso do USUÁRIO ao SOFTWARE até que as pendências financeiras tenham sido regularizadas.</p>
          <p><strong>3.11.</strong> Caso a pendência no pagamento permaneça por prazo superior a 90 (noventa) dias contados da data de vencimento, a CONTRATADA se reserva no direito de rescindir o presente contrato. Nesse caso, o USUÁRIO declara estar ciente de que todos os seus dados e informações inseridos no SOFTWARE serão apagados de forma definitiva e irrecuperável.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 4 – Obrigações da Contratada</h2>
          <p><strong>4.1.</strong> A CONTRATADA obriga-se a:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Disponibilizar o SOFTWARE, envidando os melhores esforços para assegurar e desenvolver a qualidade do mesmo, comprometendo-se a respeitar a privacidade do USUÁRIO, garantindo que não monitorará ou divulgará informações relativas à sua utilização, mantendo sigilo sobre as informações cadastrais fornecidas;</li>
            <li><strong>b)</strong> Comunicar ao USUÁRIO, por e-mail ou aviso veiculado no Website, a interrupção da prestação do serviço por ocasião de manutenções preventivas e/ou corretivas;</li>
            <li><strong>c)</strong> Manter, por si ou por terceiros, a CENTRAL DE ATENDIMENTO;</li>
            <li><strong>d)</strong> Prestar as manutenções que a CONTRATADA julgar necessárias;</li>
            <li><strong>e)</strong> Prover os suportes técnicos que forem indispensáveis ao uso do SOFTWARE.</li>
          </ul>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 5 – Obrigações do Usuário</h2>
          <p><strong>5.1.</strong> São obrigações do USUÁRIO, além das demais previstas neste instrumento e na legislação aplicável:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Pagar os valores devidos conforme o serviço escolhido;</li>
            <li><strong>b)</strong> Responsabilizar-se pelo uso e guarda de seu login e senha de acesso ao SOFTWARE;</li>
            <li><strong>c)</strong> Utilizar o SOFTWARE colocado à sua disposição somente para os fins estabelecidos no presente instrumento.</li>
          </ul>
          <p><strong>5.2.</strong> Em hipótese alguma o USUÁRIO poderá utilizar o SOFTWARE para:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Acessar, alterar e/ou copiar o conteúdo do banco de dados da CONTRATADA e/ou de terceiros sem a devida permissão;</li>
            <li><strong>b)</strong> Utilizar indevidamente login e senha de terceiros;</li>
            <li><strong>c)</strong> Utilizar o SOFTWARE para fins ilegais ou em desacordo com a legislação brasileira.</li>
          </ul>
          <p><strong>5.3.</strong> O USUÁRIO será o único e exclusivo responsável pela utilização do SOFTWARE, respondendo perante a CONTRATADA e/ou terceiros pelos danos e prejuízos que ocasionar em razão da má utilização do mesmo.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 6 – Interrupções, Garantias e Responsabilidades</h2>
          <p><strong>6.1.</strong> O uso do SOFTWARE poderá ser interrompido, sem haver qualquer direito de indenização ou compensação ao USUÁRIO, eventualmente para:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Manutenções técnicas e/ou operacionais que exijam o desligamento temporário do sistema;</li>
            <li><strong>b)</strong> Casos fortuitos ou de força maior;</li>
            <li><strong>c)</strong> Ações de terceiros que impeçam a prestação contínua do serviço;</li>
            <li><strong>d)</strong> Falta de fornecimento de energia elétrica;</li>
            <li><strong>e)</strong> Interrupção ou suspensão da prestação dos serviços de telecomunicações;</li>
            <li><strong>f)</strong> Ocorrências de falhas no sistema de transmissão e/ou roteamento no acesso à Internet.</li>
          </ul>
          <p><strong>6.2.</strong> A CONTRATADA não será responsável por danos e/ou prejuízos decorrentes de interrupções relacionadas aos eventos previstos nos itens acima.</p>
          <p><strong>6.3.</strong> A CONTRATADA não garante o funcionamento do SOFTWARE ininterruptamente e/ou isento de erros, mas se compromete a zelar pelo restabelecimento das condições ideais de uso.</p>
          <p><strong>6.4.</strong> A CONTRATADA isenta-se expressamente de quaisquer responsabilidades e indenizações, perdas e danos, lucros cessantes, prejuízos de quaisquer espécies, decorrentes direta ou indiretamente da utilização do SOFTWARE.</p>
          <p><strong>6.5.</strong> A CONTRATADA assegura ao CONTRATANTE a possibilidade de backup de seus dados, mesmo com o uso do plano suspenso, assegurando ainda, em casos de cancelamento do serviço, o prazo de 90 (noventa) dias para backup das informações e dados armazenados no SOFTWARE.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 7 – Vigência e Cancelamento</h2>
          <p><strong>7.1.</strong> O USUÁRIO é o único responsável pelo cancelamento do serviço, o qual só poderá ser feito respeitando as condições previstas no item 2.3 e seguintes.</p>
          <p><strong>7.2.</strong> Após o cancelamento do serviço, todas as informações, dados e arquivos ficarão disponíveis para backup pelo prazo de 90 (noventa) dias, após o qual serão automaticamente apagados.</p>
          <p><strong>7.3.</strong> Caso o cancelamento seja feito em desrespeito às condições estipuladas neste instrumento, o encerramento da conta terá efeito imediato, e o USUÁRIO não terá direito ao reembolso do período contratado.</p>
          <p><strong>7.4.</strong> A CONTRATADA se resguarda no direito de rescindir imediatamente o contrato caso haja indícios de que o SOFTWARE esteja sendo utilizado de forma ilícita.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 8 – Cadastro e Uso dos Dados Cadastrais</h2>
          <p><strong>8.1.</strong> Ao efetuar seu cadastro, aceitando as condições e termos deste contrato, o USUÁRIO declara e garante, expressamente, possuir capacidade jurídica para sua celebração, bem como que é financeiramente responsável pela utilização dos produtos e serviços objeto deste Contrato.</p>
          <p><strong>8.2.</strong> O USUÁRIO compromete-se a comunicar imediatamente à CONTRATADA sobre qualquer extravio, roubo, perda ou uso não autorizado de seu login e/ou senha, a fim de que possam ser bloqueados ou modificados.</p>
          <p><strong>8.3.</strong> A CONTRATADA exonera-se de toda e qualquer responsabilidade decorrente do uso indevido, negligente ou imprudente do login e/ou da senha por parte do USUÁRIO.</p>
          <p><strong>8.4.</strong> O USUÁRIO deverá fornecer, no momento da Confirmação Contratual, informações verdadeiras, atualizadas e completas.</p>
          <p><strong>8.5.</strong> Caso os dados informados estejam errados ou incompletos, a CONTRATADA poderá, a seus exclusivos critérios, suspender ou cancelar automaticamente os serviços contratados.</p>
          <p><strong>8.6.</strong> O registro e a utilização eletrônica dos dados cadastrais têm como finalidade o estabelecimento do vínculo contratual, a gestão, administração, prestação, ampliação e aprimoramento dos serviços ao USUÁRIO.</p>
          <p><strong>8.7.</strong> A CONTRATADA garante que adota os melhores níveis quanto à segurança na proteção dos dados cadastrais do USUÁRIO.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 9 – Propriedade Intelectual</h2>
          <p><strong>9.1.</strong> Ressalvada estipulação expressa em contrário, são de propriedade exclusiva da CONTRATADA o conteúdo do WEBSITE, como textos, gráficos, planilhas, ícones, desenhos, programas de computador, incluindo o suporte lógico, a descrição básica e o material de apoio, estando todos protegidos pelas leis brasileiras de direito intelectual.</p>
          <p><strong>9.2.</strong> O uso não autorizado, a divulgação, a reprodução total ou parcial dos conteúdos disponibilizados são práticas estritamente proibidas, sujeitando o infrator às sanções de natureza penal, civil e administrativa cabíveis.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 10 – Lei Geral de Proteção de Dados – Lei 13.709/2018</h2>
          <p><strong>10.1.</strong> A prestação do serviço descrito neste contrato pela CONTRATADA obedece às leis brasileiras, em especial à Lei Geral de Proteção de Dados do Brasil (Lei 13.709/2018).</p>
          <p><strong>10.2.</strong> A sua privacidade é importante para nós:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Coletamos suas informações pessoais diretamente de você, por meio de suas interações, uso e experiências com nosso site, produtos e serviços;</li>
            <li><strong>b)</strong> Usamos suas informações pessoais para fornecer nossos produtos e serviços, melhorá-los e personalizá-los, além de cumprir as leis aplicáveis;</li>
            <li><strong>c)</strong> Utilizamos cookies e tecnologias similares para adaptar sua experiência;</li>
            <li><strong>d)</strong> Você pode exercer seus Direitos de Privacidade em relação às suas informações pessoais acessando nossa CENTRAL DE ATENDIMENTO;</li>
            <li><strong>e)</strong> A CONTRATADA nomeará um encarregado responsável pela proteção de dados.</li>
          </ul>
          <p><strong>10.3.</strong> Você, como USUÁRIO, tem os seguintes direitos de privacidade conforme as leis aplicáveis:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>a)</strong> Direito ao conhecimento e confirmação da existência de tratamento de dados pessoais;</li>
            <li><strong>b)</strong> Direito de acesso aos dados pessoais que possuímos;</li>
            <li><strong>c)</strong> Direito de retificação de dados incompletos, imprecisos ou desatualizados;</li>
            <li><strong>d)</strong> Direito à objeção e revogação de consentimento;</li>
            <li><strong>e)</strong> Direito à portabilidade dos dados;</li>
            <li><strong>f)</strong> Direito à exclusão de informações pessoais;</li>
            <li><strong>g)</strong> Direito de estar livre de discriminação por exercer seus direitos de privacidade.</li>
          </ul>
          <p><strong>10.4.</strong> Solicitação de Acesso ou Exclusão de Dados: entre em contato conosco por meio da CENTRAL DE ATENDIMENTO.</p>
          <p><strong>10.5.</strong> Adotamos medidas de proteção técnicas, organizacionais e de segurança adequadas para proteger seus dados pessoais, incluindo uso de criptografia, limitação de acesso e monitoramento de parceiros de negócios.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 11 – Outras Condições Gerais</h2>
          <p><strong>11.1.</strong> As partes concordam que a CONTRATADA poderá, a seus exclusivos critérios, alterar qualquer procedimento técnico referente aos serviços contratados, sem aviso.</p>
          <p><strong>11.2.</strong> O não exercício, por qualquer uma das partes, de qualquer direito consagrado no presente instrumento, não representará novação, transação ou renúncia de tal direito.</p>
          <p><strong>11.3.</strong> Se qualquer cláusula deste Contrato for considerada nula, tal nulidade não contaminará as demais cláusulas, o qual permanecerá em pleno vigor.</p>

          <h2 className="text-xl font-bold text-white pt-4">Cláusula 12 – Foro</h2>
          <p><strong>12.1.</strong> Fica eleito o Foro da Comarca de Tobias Barreto, Estado de Sergipe, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir qualquer dúvida que surja na efetivação do presente contrato, regendo-se pela legislação em vigor todos os casos não previstos no presente instrumento contratual.</p>

          <p className="pt-6">
            E, por estarem as partes, CONTRATADA e CONTRATANTE, de pleno acordo com o disposto neste instrumento particular, assinam-no digitalmente, para produzir seus efeitos legais.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
            <div>
              <p className="text-white font-bold">OTTO TECH SISTEMAS</p>
              <p className="text-xs text-gray-500">CONTRATADA</p>
            </div>
            <div>
              <p className="text-white font-bold">CONTRATANTE / USUÁRIO</p>
              <p className="text-xs text-gray-500">Aceite eletrônico no momento do cadastro</p>
            </div>
          </div>
        </article>

        <div className="mt-10 flex justify-center">
          <Link to="/cadastro">
            <Button className="bg-[hsl(3, 62%, 46%)] hover:bg-[hsl(3, 55%, 52%)] text-white">
              Voltar ao cadastro
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
