import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchApplication } from './entities/branch-application.entity';
import { ApprovalRecord } from './entities/approval-record.entity';
import { Expert } from './entities/expert.entity';
import { ExpertCertificate } from './entities/expert-certificate.entity';
import { ExpertAssignment } from './entities/expert-assignment.entity';
import { BranchHrService } from './branch-hr.service';
import { BranchHrController } from './branch-hr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BranchApplication, ApprovalRecord, Expert, ExpertCertificate, ExpertAssignment])],
  controllers: [BranchHrController],
  providers: [BranchHrService],
  exports: [BranchHrService],
})
export class BranchHrModule {}
